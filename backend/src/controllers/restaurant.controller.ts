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
    categories: Array<{
        id: string;
        name: string;
        items: Array<{
            id: string;
            name: string;
            price: number;
            description?: string;
            variants?: Array<{ id: string; name: string; priceDelta: number }>;
            optionGroups?: Array<{
                id: string;
                name: string;
                type: 'single' | 'multi';
                required?: boolean;
                maxSelect?: number;
                options: Array<{ id: string; name: string; priceDelta: number }>;
            }>;
        }>;
    }>;
    currency?: string;
};

// Helper: parse optionGroups node (works for both <optionGroups> or <extras>)
const parseOptionGroupsNode = (rootNode: any): Array<{
    id: string;
    name: string;
    type: 'single' | 'multi';
    required?: boolean;
    maxSelect?: number;
    appliesTo?: string;
    options: Array<{ id: string; name: string; priceDelta: number; default?: boolean }>;
}> | undefined => {
    if (!rootNode) return undefined;
    const ogNode = rootNode.optionGroup || rootNode.optionGroups?.optionGroup || [];
    const ogArray = Array.isArray(ogNode) ? ogNode : [ogNode];
    const mapped = ogArray
        .filter((g: any) => g && g.id && g.name && (g.type === 'single' || g.type === 'multi'))
        .map((g: any) => {
            const rawOptNode = (g.options && g.options.option !== undefined)
                ? g.options.option
                : (g.option !== undefined ? g.option : []);
            const optArray = Array.isArray(rawOptNode) ? rawOptNode : [rawOptNode];
            const options = optArray
                .filter((o: any) => o && o.id && o.name && (o.priceDelta !== undefined))
                .map((o: any) => ({ id: String(o.id), name: String(o.name), priceDelta: Number(o.priceDelta), default: (o.default === true || o.default === 'true') }));
            return {
                id: String(g.id),
                name: String(g.name),
                type: (g.type === 'multi' ? 'multi' : 'single') as 'multi' | 'single',
                required: g.required === true || g.required === 'true',
                maxSelect: g.maxSelect !== undefined ? Number(g.maxSelect) : undefined,
                appliesTo: g.appliesTo ? String(g.appliesTo) : undefined,
                options,
            };
        });
    return mapped.length ? mapped : undefined;
};

const slugify = (s: string): string =>
    String(s)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '_');

const mapXmlToMenu = (xmlString: string): ParsedMenu => {
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
    const parsed: any = parser.parse(xmlString);
    // Ondersteun zowel <restaurant> als een compact <menu> formaat
    if (parsed.menu) {
        return mapCompactMenuXml(parsed.menu);
    }
    const root = parsed.restaurant || {};
    const currency = root.info?.currency || 'EUR';
    const categoriesNode = root.categories?.category || [];
    const categoriesArray = Array.isArray(categoriesNode) ? categoriesNode : [categoriesNode];

    const globalGroups = parseOptionGroupsNode(root.extras);

    const categories = categoriesArray
        .filter((c: any) => c && c.items)
        .map((c: any) => {
            const itemsNode = c.items?.item || [];
            const itemsArray = Array.isArray(itemsNode) ? itemsNode : [itemsNode];
            const useGlobalAtCategory = !(c.useGlobalExtras === false || c.useGlobalExtras === 'false');
            const items = itemsArray
                .filter((i: any) => i && i.id && i.name && i.price !== undefined)
                .map((i: any) => {
                    const useGlobalAtItem = !(i.useGlobalExtras === false || i.useGlobalExtras === 'false');
                    const variants = (() => {
                        const vNode = i.variants?.variant || [];
                        const vArray = Array.isArray(vNode) ? vNode : [vNode];
                        const mapped = vArray
                            .filter((v: any) => v && v.id && v.name && v.priceDelta !== undefined)
                            .map((v: any) => ({ id: String(v.id), name: String(v.name), priceDelta: Number(v.priceDelta) }));
                        return mapped.length ? mapped : undefined;
                    })();
                    // Item-specifieke groepen
                    const itemGroups = parseOptionGroupsNode(i.optionGroups);
                    // Merge met globale (override: item wint bij gelijke group-id)
                    let mergedGroups = itemGroups ? [...itemGroups] : [];
                    if (useGlobalAtCategory && useGlobalAtItem && globalGroups && globalGroups.length) {
                        const ids = new Set(mergedGroups.map(g => g.id));
                        for (const gg of globalGroups) {
                            if (!ids.has(gg.id)) mergedGroups.push(gg);
                        }
                    }
                    return {
                        id: String(i.id),
                        name: String(i.name),
                        price: Number(i.price),
                        description: i.description ? String(i.description) : undefined,
                        variants,
                        optionGroups: mergedGroups.length ? mergedGroups : undefined,
                    };
                });
            return {
                id: String(c.id),
                name: String(c.name),
                items,
            };
        });

    return { categories, currency };
};

// Compact formaat: <menu><category><sub><name>..</name><size15cm>..</size15cm><size30cm>..</size30cm></sub>...</category>...</menu>
const mapCompactMenuXml = (menuRoot: any): ParsedMenu => {
    const currency = 'EUR';
    const categoriesNode = menuRoot.category || [];
    const categoriesArray = Array.isArray(categoriesNode) ? categoriesNode : [categoriesNode];

    const defaultGroups = (variantIds: { small: string; large: string }) => ([
        {
            id: 'bread', name: 'Brood', type: 'single' as const, required: true, options: [
                { id: 'geen_keuze', name: 'Maak een keuze', priceDelta: 0, default: true },
                { id: 'white', name: 'Wit', priceDelta: 0 },
                { id: 'italian_herbs', name: 'Italian Herbs & Cheese', priceDelta: 0 },
                { id: 'sesame', name: 'Sesam', priceDelta: 0 },
                { id: 'multigrain', name: 'Meerzaden', priceDelta: 0 },
                { id: 'wholegrain', name: 'Volkoren', priceDelta: 0 },
            ]
        },
        {
            id: 'preparation', name: 'Bereidingswijze', type: 'single' as const, required: true, options: [
                { id: 'geen_keuze_prep', name: 'Maak een keuze', priceDelta: 0, default: true },
                { id: 'toasted', name: 'Getoast', priceDelta: 0 },
                { id: 'not_toasted', name: 'Niet Getoast', priceDelta: 0 },
            ]
        },
        {
            id: 'vegetables', name: 'Groente', type: 'multi' as const, options: [
                { id: 'lettuce', name: 'Sla', priceDelta: 0 },
                { id: 'tomato', name: 'Tomaat', priceDelta: 0 },
                { id: 'bell_pepper', name: 'Paprika', priceDelta: 0 },
                { id: 'onion', name: 'Ui', priceDelta: 0 },
                { id: 'cucumber', name: 'Komkommer', priceDelta: 0 },
                { id: 'olives', name: 'Olijf', priceDelta: 0 },
                { id: 'jalapenos', name: 'Jalapeños', priceDelta: 0 },
                { id: 'corn', name: 'Maïs', priceDelta: 0 },
                { id: 'pickles', name: 'Augurk', priceDelta: 0 },
            ]
        },
        {
            id: 'sauces', name: 'Saus', type: 'multi' as const, maxSelect: 3, options: [
                { id: 'sweet_chili', name: 'Sweet Chili', priceDelta: 0 },
                { id: 'chipotle_southwest', name: 'Chipotle Southwest', priceDelta: 0 },
                { id: 'lite_mayo', name: 'Lite Mayo', priceDelta: 0 },
                { id: 'sweet_onion', name: 'Sweet Onion', priceDelta: 0 },
                { id: 'honey_mustard', name: 'Whole Grain Honey Mustard', priceDelta: 0 },
                { id: 'hickory_bbq', name: 'Hickory Smoked BBQ', priceDelta: 0 },
                { id: 'vegan_garlic', name: 'Vegan Garlic Aioli', priceDelta: 0 },
                { id: 'x_spicy_chipotle', name: 'X-Spicy Chipotle Southwest', priceDelta: 0 },
                { id: 'doner_sauce', name: 'Döner Sauce', priceDelta: 0 },
            ]
        },
        {
            id: 'toppings', name: 'Toppings', type: 'multi' as const, options: [
                { id: 'salt', name: 'Zout', priceDelta: 0 },
                { id: 'pepper', name: 'Peper', priceDelta: 0 },
                { id: 'crispy_onions', name: 'Gebakken Uitjes', priceDelta: 0 },
            ]
        },
        {
            id: 'extras_30cm', name: 'Extra (30cm)', type: 'multi' as const, appliesTo: variantIds.large, options: [
                { id: 'bacon_30', name: 'Bacon', priceDelta: 2.50 },
                { id: 'double_cheese_30', name: 'Dubbel Kaas', priceDelta: 1.50 },
                { id: 'guacamole_30', name: 'Guacamole', priceDelta: 3.00 },
                { id: 'caramelized_onion_30', name: 'Gekarameliseerde Rode Ui', priceDelta: 1.50 },
                { id: 'mozzarella_30', name: 'Mozzarella', priceDelta: 2.20 },
                { id: 'chicken_teriyaki_30', name: 'Chicken Teriyaki', priceDelta: 5.00 },
                { id: 'chicken_fajita_30', name: 'Chicken Fajita', priceDelta: 5.00 },
                { id: 'pepperoni_30', name: 'Pepperoni', priceDelta: 2.20 },
                { id: 'ham_30', name: 'Ham', priceDelta: 5.00 },
                { id: 'salami_30', name: 'Salami', priceDelta: 3.50 },
                { id: 'rotisserie_30', name: 'Rotisserie Style Chicken', priceDelta: 3.50 },
                { id: 'double_meat_30', name: 'Double Meat', priceDelta: 5.00 },
            ]
        },
        {
            id: 'extras_15cm', name: 'Extra (15cm)', type: 'multi' as const, appliesTo: variantIds.small, options: [
                { id: 'bacon_15', name: 'Bacon', priceDelta: 1.50 },
                { id: 'double_cheese_15', name: 'Dubbel Kaas', priceDelta: 0.75 },
                { id: 'guacamole_15', name: 'Guacamole', priceDelta: 2.00 },
                { id: 'caramelized_onion_15', name: 'Gekarameliseerde Rode Ui', priceDelta: 0.75 },
                { id: 'mozzarella_15', name: 'Mozzarella', priceDelta: 1.20 },
                { id: 'chicken_teriyaki_15', name: 'Chicken Teriyaki', priceDelta: 3.00 },
                { id: 'chicken_fajita_15', name: 'Chicken Fajita', priceDelta: 3.00 },
                { id: 'pepperoni_15', name: 'Pepperoni', priceDelta: 1.20 },
                { id: 'ham_15', name: 'Ham', priceDelta: 3.00 },
                { id: 'salami_15', name: 'Salami', priceDelta: 2.50 },
                { id: 'rotisserie_15', name: 'Rotisserie Style Chicken', priceDelta: 2.50 },
                { id: 'double_meat_15', name: 'Double Meat', priceDelta: 3.00 },
            ]
        },
    ]);

    const categories = categoriesArray.map((cat: any, idx: number) => {
        const catName: string = String(cat.name || `Categorie_${idx + 1}`);
        const subsNode = cat.sub || [];
        const subsArray = Array.isArray(subsNode) ? subsNode : [subsNode];
        const items = subsArray
            .filter((s: any) => s && s.name && (s.size15cm !== undefined || s.size30cm !== undefined))
            .map((s: any) => {
                const name = String(s.name);
                const id = slugify(name);
                const price15 = Number(s.size15cm || 0);
                const price30 = Number(s.size30cm || 0);
                const delta = Math.max(0, price30 - price15);
                const variants = [
                    { id: '15cm', name: '15 cm', priceDelta: 0 },
                    { id: '30cm', name: '30 cm (Footlong)', priceDelta: delta },
                ];
                return {
                    id,
                    name,
                    price: price15,
                    variants,
                    optionGroups: defaultGroups({ small: '15cm', large: '30cm' }),
                };
            });
        return { id: slugify(catName), name: catName, items };
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
                // Variants validatie
                for (const v of i.variants || []) {
                    if (!v.id || !v.name || typeof v.priceDelta !== 'number' || v.priceDelta < 0) {
                        const error = new Error(`Variant ongeldig bij item ${i.id}`) as ApiError;
                        error.statusCode = 400;
                        throw error;
                    }
                }
                // Option groups validatie
                for (const g of i.optionGroups || []) {
                    if (!g.id || !g.name || (g.type !== 'single' && g.type !== 'multi')) {
                        const error = new Error(`OptionGroup ongeldig bij item ${i.id}`) as ApiError;
                        error.statusCode = 400;
                        throw error;
                    }
                    for (const o of g.options || []) {
                        if (!o.id || !o.name || typeof o.priceDelta !== 'number' || o.priceDelta < 0) {
                            const error = new Error(`Option ongeldig in group ${g.id} bij item ${i.id}`) as ApiError;
                            error.statusCode = 400;
                            throw error;
                        }
                    }
                }
            }
        }

        // Replace-strategie: overschrijf menu
        restaurant.menu = {
            categories: menu.categories.map((c) => ({
                id: c.id,
                name: c.name,
                items: (c.items || []).map((i) => ({
                    id: i.id,
                    name: i.name,
                    description: i.description,
                    price: i.price,
                    variants: i.variants,
                    optionGroups: i.optionGroups,
                })),
            })),
            currency: menu.currency || 'EUR',
        };

        await restaurant.save();

        res.json({ success: true, menu: restaurant.menu });
    } catch (error) {
        next(error);
    }
};