/* eslint-disable @next/next/no-img-element */

import React, { useContext } from 'react';
import AppMenuitem from './AppMenuitem';
import { LayoutContext } from './context/layoutcontext';
import { MenuProvider } from './context/menucontext';
import Link from 'next/link';
import { AppMenuItem } from '@/types';

const AppMenu = () => {
    const { layoutConfig } = useContext(LayoutContext);

    const model: AppMenuItem[] = [
        {
            label: 'Home',
            items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/dashboard' }]
        },
        {
            label: 'Management',
            items: [
                { label: 'Coach', icon: 'pi pi-fw pi-eye', to: '/coach' },
                { label: 'Students', icon: 'pi pi-fw pi-check-square', to: '/students' },
                { label: 'Curriculum', icon: 'pi pi-fw pi-bookmark', to: '/curriculum' },
                { label: 'session history', icon: 'pi pi-fw pi-exclamation-circle', to: '/session-history' },
                { label: 'Analytics', icon: 'pi pi-fw pi-mobile', to: '/analytics' }
            ]
        },
       
        {
            label: 'Settings',
            icon: 'pi pi-fw pi-cog',
            items: [
                {
                    label: 'Theme Settings',
                    icon: 'pi pi-fw pi-palette',
                    command: () => {
                        // Trigger theme config sidebar
                        const event = new CustomEvent('open-theme-config');
                        window.dispatchEvent(event);
                    }
                },
                {
                    label: 'Layout Settings',
                    icon: 'pi pi-fw pi-sliders-h',
                    command: () => {
                        // Trigger layout config sidebar
                        const event = new CustomEvent('open-layout-config');
                        window.dispatchEvent(event);
                    }
                }
            ]
        },
        {
            label: 'Pages',
            icon: 'pi pi-fw pi-briefcase',
            to: '/pages',
            items: [
                {
                    label: 'Landing',
                    icon: 'pi pi-fw pi-globe',
                    to: '/landing'
                },
                {
                    label: 'Auth',
                    icon: 'pi pi-fw pi-user',
                    items: [
                        {
                            label: 'Login',
                            icon: 'pi pi-fw pi-sign-in',
                            to: '/auth/login'
                        },
                        {
                            label: 'Error',
                            icon: 'pi pi-fw pi-times-circle',
                            to: '/auth/error'
                        },
                        {
                            label: 'Access Denied',
                            icon: 'pi pi-fw pi-lock',
                            to: '/auth/access'
                        }
                    ]
                },
                
            ]
        },
    ];

    return (
        <MenuProvider>
            <ul className="layout-menu">
                {model.map((item, i) => {
                    return !item?.seperator ? <AppMenuitem item={item} root={true} index={i} key={item.label} /> : <li className="menu-separator"></li>;
                })}

            </ul>
        </MenuProvider>
    );
};

export default AppMenu;
