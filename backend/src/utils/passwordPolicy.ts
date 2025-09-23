import crypto from 'node:crypto';
import https from 'node:https';

export type PasswordValidationResult = {
    ok: boolean;
    message?: string;
};

export function validatePasswordComplexity(password: string, name?: string, email?: string): PasswordValidationResult {
    if (!password || password.length < 12) {
        return { ok: false, message: 'Wachtwoord moet minimaal 12 karakters bevatten' };
    }
    if (!/[a-z]/.test(password)) {
        return { ok: false, message: 'Minstens één kleine letter vereist' };
    }
    if (!/[A-Z]/.test(password)) {
        return { ok: false, message: 'Minstens één hoofdletter vereist' };
    }
    if (!/[0-9]/.test(password)) {
        return { ok: false, message: 'Minstens één cijfer vereist' };
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
        return { ok: false, message: 'Minstens één speciaal teken vereist' };
    }

    const lowered = password.toLowerCase();
    const namePart = (name || '').toLowerCase().replace(/\s+/g, '');
    const emailLocal = (email || '').toLowerCase().split('@')[0] || '';
    if (namePart && namePart.length >= 3 && lowered.includes(namePart)) {
        return { ok: false, message: 'Wachtwoord mag je naam niet bevatten' };
    }
    if (emailLocal && emailLocal.length >= 3 && lowered.includes(emailLocal)) {
        return { ok: false, message: 'Wachtwoord mag geen deel van je e-mailadres bevatten' };
    }

    return { ok: true };
}

export async function isPasswordPwned(password: string): Promise<boolean> {
    const sha1 = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);

    const body: string = await new Promise((resolve, reject) => {
        const req = https.request(
            {
                method: 'GET',
                host: 'api.pwnedpasswords.com',
                path: `/range/${prefix}`,
                headers: {
                    'Add-Padding': 'true',
                    'User-Agent': 'LunchMonkeys/1.0',
                },
            },
            (res) => {
                let data = '';
                res.on('data', (chunk) => (data += chunk));
                res.on('end', () => resolve(data));
            }
        );
        req.on('error', reject);
        req.end();
    });

    const lines = body.split('\n');
    for (const line of lines) {
        const [hashSuffix, countStr] = line.trim().split(':');
        if (!hashSuffix || !countStr) continue;
        if (hashSuffix.toUpperCase() === suffix) {
            const count = parseInt(countStr, 10);
            return Number.isFinite(count) && count > 0;
        }
    }
    return false;
}


