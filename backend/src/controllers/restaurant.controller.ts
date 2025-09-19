import { Request, Response, NextFunction } from 'express';
import { Restaurant } from '../models/Restaurant.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { ApiError } from '../middleware/error.middleware';
import { cloudinary, uploadToCloudinary } from '../config/cloudinary.config';
import { XMLParser } from 'fast-xml-parser';

export const getRestaurants = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const restaurants = await Restaurant.find()
            .populate('createdBy', 'name email')
            .sort('-createdAt');

        res.json({
            success: true,
            count: restaurants.length,
            restaurants,
        });
    } catch (error) {
        next(error);
    }
};

export const createRestaurant = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { name, websiteUrl, menuUrl } = req.body;

        if (!req.file) {
            const error = new Error('Restaurant afbeelding is verplicht') as ApiError;
            error.statusCode = 400;
            throw error;
        }

        // Upload image to Cloudinary
        const imageUrl = await uploadToCloudinary(req.file, 'lunchmonkeys/restaurants', {
            width: 1200,
            height: 800,
            crop: 'limit'
        });

        const restaurant = await Restaurant.create({
            name,
            imageUrl,
            websiteUrl,
            menuUrl,
            createdBy: req.user!._id,
        });

        res.status(201).json({
            success: true,
            restaurant,
        });
    } catch (error) {
        next(error);
    }
};

export const updateRestaurant = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id } = req.params;
        const updateData: any = { ...req.body };

        // Als er een nieuwe afbeelding is geupload
        if (req.file) {
            // Upload nieuwe afbeelding
            updateData.imageUrl = await uploadToCloudinary(req.file, 'lunchmonkeys/restaurants', {
                width: 1200,
                height: 800,
                crop: 'limit'
            });

            // Verwijder oude afbeelding van Cloudinary
            const restaurant = await Restaurant.findById(id);
            if (restaurant && restaurant.imageUrl) {
                const publicId = restaurant.imageUrl.split('/').pop()?.split('.')[0];
                if (publicId) {
                    await cloudinary.uploader.destroy(`lunchmonkeys/restaurants/${publicId}`);
                }
            }
        }

        const restaurant = await Restaurant.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!restaurant) {
            const error = new Error('Restaurant niet gevonden') as ApiError;
            error.statusCode = 404;
            throw error;
        }

        res.json({
            success: true,
            restaurant,
        });
    } catch (error) {
        next(error);
    }
};

export const deleteRestaurant = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id } = req.params;

        const restaurant = await Restaurant.findById(id);
        if (!restaurant) {
            const error = new Error('Restaurant niet gevonden') as ApiError;
            error.statusCode = 404;
            throw error;
        }

        // Verwijder afbeelding van Cloudinary
        if (restaurant.imageUrl) {
            const publicId = restaurant.imageUrl.split('/').pop()?.split('.')[0];
            if (publicId) {
                await cloudinary.uploader.destroy(`lunchmonkeys/restaurants/${publicId}`);
            }
        }

        await restaurant.deleteOne();

        res.json({
            success: true,
            message: 'Restaurant verwijderd',
        });
    } catch (error) {
        next(error);
    }
};

export const getRestaurantMenu = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id } = req.params;
        const restaurant = await Restaurant.findById(id);
        if (!restaurant) {
            const error = new Error('Restaurant niet gevonden') as ApiError;
            error.statusCode = 404;
            throw error;
        }

        res.json({ success: true, menu: restaurant.menu || { categories: [], currency: 'EUR' } });
    } catch (error) {
        next(error);
    }
};

type ParsedMenu = {
    categories: Array<{ id: string; name: string; items: Array<{ id: string; name: string; price: number; description?: string }> }>;
    currency?: string;
};

const mapXmlToMenu = (xmlString: string): ParsedMenu => {
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
    const parsed: any = parser.parse(xmlString);
    const root = parsed.restaurant || {};
    const currency = root.info?.currency || 'EUR';
    const categoriesNode = root.categories?.category || [];
    const categoriesArray = Array.isArray(categoriesNode) ? categoriesNode : [categoriesNode];

    const categories = categoriesArray
        .filter((c: any) => c && c.items)
        .map((c: any) => {
            const itemsNode = c.items?.item || [];
            const itemsArray = Array.isArray(itemsNode) ? itemsNode : [itemsNode];
            const items = itemsArray
                .filter((i: any) => i && i.id && i.name && i.price !== undefined)
                .map((i: any) => ({
                    id: String(i.id),
                    name: String(i.name),
                    price: Number(i.price),
                    description: i.description ? String(i.description) : undefined,
                }));
            return {
                id: String(c.id),
                name: String(c.name),
                items,
            };
        });

    return { categories, currency };
};

export const importRestaurantMenu = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id } = req.params;
        const restaurant = await Restaurant.findById(id);
        if (!restaurant) {
            const error = new Error('Restaurant niet gevonden') as ApiError;
            error.statusCode = 404;
            throw error;
        }

        let menu: ParsedMenu | null = null;

        if (req.file) {
            const mime = req.file.mimetype;
            const text = req.file.buffer.toString('utf-8');
            if (mime.includes('xml') || text.trim().startsWith('<')) {
                menu = mapXmlToMenu(text);
            } else if (mime.includes('json') || text.trim().startsWith('{') || text.trim().startsWith('[')) {
                const json = JSON.parse(text);
                menu = json;
            } else {
                const error = new Error('Bestandsformaat niet ondersteund. Gebruik XML of JSON.') as ApiError;
                error.statusCode = 400;
                throw error;
            }
        } else if (req.is('application/json')) {
            menu = req.body as ParsedMenu;
        }

        if (!menu || !Array.isArray(menu.categories)) {
            const error = new Error('Ongeldig menu-formaat') as ApiError;
            error.statusCode = 400;
            throw error;
        }

        // Validatie: unieke ids binnen items en categorieën, non-empty namen, prijzen >= 0
        const seenCategoryIds = new Set<string>();
        const seenItemIds = new Set<string>();
        for (const c of menu.categories) {
            if (!c.id || !c.name) {
                const error = new Error('Categorie mist id of name') as ApiError;
                error.statusCode = 400;
                throw error;
            }
            if (seenCategoryIds.has(c.id)) {
                const error = new Error(`Dubbele categorie id: ${c.id}`) as ApiError;
                error.statusCode = 400;
                throw error;
            }
            seenCategoryIds.add(c.id);
            for (const i of c.items || []) {
                if (!i.id || !i.name || typeof i.price !== 'number' || i.price < 0) {
                    const error = new Error('Item mist id/name of heeft ongeldige prijs') as ApiError;
                    error.statusCode = 400;
                    throw error;
                }
                if (seenItemIds.has(i.id)) {
                    const error = new Error(`Dubbele item id: ${i.id}`) as ApiError;
                    error.statusCode = 400;
                    throw error;
                }
                seenItemIds.add(i.id);
            }
        }

        // Replace-strategie: overschrijf menu
        restaurant.menu = {
            categories: menu.categories.map((c) => ({
                id: c.id,
                name: c.name,
                items: (c.items || []).map((i) => ({ id: i.id, name: i.name, description: i.description, price: i.price })),
            })),
            currency: menu.currency || 'EUR',
        };

        await restaurant.save();

        res.json({ success: true, menu: restaurant.menu });
    } catch (error) {
        next(error);
    }
};