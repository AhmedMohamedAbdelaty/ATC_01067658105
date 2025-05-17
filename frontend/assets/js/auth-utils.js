const TokenUtils = {
    isTokenExpired: function (token) {
        if (!token) {
            return true;
        }
        try {
            const payloadBase64 = token.split('.')[1];
            if (!payloadBase64) {
                console.warn('Invalid token structure');
                return true;
            }
            const decoded = JSON.parse(atob(payloadBase64));
            if (!decoded || typeof decoded.exp !== 'number') {
                return true;
            }
            const currentTime = Math.floor(Date.now() / 1000);
            return decoded.exp < currentTime;
        } catch (e) {
            console.error('Error decoding token:', e);
            return true;
        }
    },

    parseJwt: function (token) {
        if (!token) return null;
        try {
            const payloadBase64 = token.split('.')[1];
            if (!payloadBase64) {
                console.warn('Invalid token structure for parsing');
                return null;
            }
            return JSON.parse(atob(payloadBase64));
        } catch (e) {
            console.error('Error parsing JWT:', e);
            return null;
        }
    },
};
