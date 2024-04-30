const BaseService = require("../BaseService");

class OTPService extends BaseService {
    static MODULES = {
        otpauth: require('otpauth'),
        crypto: require('crypto'),
        ['hi-base32']: require('hi-base32'),
    }

    create_secret () {
        const require = this.require;
        const otpauth = require('otpauth');

        const secret = this.gen_otp_secret_();
        const totp = new otpauth.TOTP({
            issuer: 'puter.com',
            label: 'Puter Auth',
            algorithm: 'SHA1',
            digits: 6,
            secret,
        });

        return {
            url: totp.toString(),
            secret,
        };
    }

    verify (secret, code) {
        const require = this.require;
        const otpauth = require('otpauth');

        const totp = new otpauth.TOTP({
            issuer: 'puter.com',
            label: 'Puter Auth',
            algorithm: 'SHA1',
            digits: 6,
            secret,
        });

        const ok = totp.validate({ token: code });
        return ok;
    }

    gen_otp_secret_ () {
        const require = this.require;
        const crypto = require('crypto');
        const { encode } = require('hi-base32');

        const buffer = crypto.randomBytes(15);
        const base32 = encode(buffer).replace(/=/g, "").substring(0, 24);
        return base32;
    };
};

module.exports = { OTPService };