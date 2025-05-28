import React from 'react';
import { links as navLinksData } from '../Constants';
import LinkItem from './LinkItem'; 

const NavigationLinks = () => (
    <nav className="space-y-1 flex-grow"> {/* flex-grow para ocupar espaço e empurrar o footer */}
        <ul>
            {navLinksData.map((link) => (
                // Usar uma chave única e estável do item, se disponível (ex: link.id ou link.path)
                // Usar link.label como fallback se outras chaves não forem ideais ou únicas
                <LinkItem key={link.id || link.path || link.label} {...link} />
            ))}
        </ul>
    </nav>
);

export default NavigationLinks;