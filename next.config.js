/** @type {import('next').NextConfig} */
const nextConfig = {reactStrictMode: false,
    eslint: {
        ignoreDuringBuilds: true
    },
    async redirects() {
        return [
            {
                source: '/',
                destination: '/dashboard',
                permanent: true
            }
];
    }
}; 
module.exports = nextConfig
