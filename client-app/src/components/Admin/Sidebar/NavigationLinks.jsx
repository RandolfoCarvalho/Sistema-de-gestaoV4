import React from 'react';
import { links as navLinksData } from '../Constants';
import LinkItem from './LinkItem'; 

const NavigationLinks = () => (
    <nav className="space-y-1 flex-grow">
        <ul>
            {navLinksData.map((link) => (
                <LinkItem key={link.id || link.path || link.label} {...link} />
            ))}
        </ul>
    </nav>
);

export default NavigationLinks;