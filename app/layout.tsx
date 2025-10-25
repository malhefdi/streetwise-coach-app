'use client';
import { LayoutProvider } from '../layout/context/layoutcontext';
import { PrimeReactProvider } from 'primereact/api';
import 'primereact/resources/primereact.css';
import 'primeflex/primeflex.css';
import 'primeicons/primeicons.css';
import '../styles/layout/layout.scss';


interface RootLayoutProps {
    children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link id="theme-css" href={`/themes/lara-dark-green/theme.css`} rel="stylesheet"></link>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            // Remove fdprocessedid attributes that cause hydration warnings
                            if (typeof window !== 'undefined') {
                                const observer = new MutationObserver((mutations) => {
                                    mutations.forEach((mutation) => {
                                        mutation.addedNodes.forEach((node) => {
                                            if (node.nodeType === Node.ELEMENT_NODE) {
                                                const element = node as Element;
                                                if (element.hasAttribute && element.hasAttribute('fdprocessedid')) {
                                                    element.removeAttribute('fdprocessedid');
                                                }
                                                // Also check child elements
                                                const childrenWithFdprocessedId = element.querySelectorAll('[fdprocessedid]');
                                                childrenWithFdprocessedId.forEach((child) => {
                                                    child.removeAttribute('fdprocessedid');
                                                });
                                            }
                                        });
                                    });
                                });
                                
                                // Start observing when DOM is ready
                                if (document.readyState === 'loading') {
                                    document.addEventListener('DOMContentLoaded', () => {
                                        observer.observe(document.body, {
                                            childList: true,
                                            subtree: true
                                        });
                                    });
                                } else {
                                    observer.observe(document.body, {
                                        childList: true,
                                        subtree: true
                                    });
                                }
                            }
                        `,
                    }}
                />
            </head>
            <body>
                <PrimeReactProvider>
                    <LayoutProvider>{children}</LayoutProvider>
                </PrimeReactProvider>
            </body>
        </html>
    );
}
