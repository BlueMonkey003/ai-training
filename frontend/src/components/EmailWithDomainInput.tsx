import React from 'react';
import { Input } from './ui/input';

type Props = {
    id: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    autoFocus?: boolean;
    className?: string;
    domain?: string; // default @bluemonkeysit.nl
};

const EmailWithDomainInput: React.FC<Props> = ({ id, value, onChange, placeholder = 'voornaam.achternaam', autoFocus, className, domain = '@bluemonkeysit.nl' }) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value.replace(/@.*/, '');
        onChange(newValue);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === '@') {
            e.preventDefault();
        }
    };

    return (
        <div className="flex">
            <Input
                id={id}
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                required
                autoFocus={autoFocus}
                className={`${className || ''} rounded-r-none`}
            />
            <span className="inline-flex items-center px-3 border border-l-0 border-gray-300 bg-gray-100 text-gray-700 rounded-r-md text-sm select-none">
                {domain}
            </span>
        </div>
    );
};

export default EmailWithDomainInput;


