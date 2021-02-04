var assert = require('assert'),
    Setup = require('../../').setup;

describe('Setup', function () {
    it('should initialize with environment variables when no parameters are given', function (done){
        var setup = new Setup();
        assert.strictEqual(setup.config['X-MARCHAND-KEY'], process.env.PAYDUNYA_MASTER_KEY);
        assert.strictEqual(setup.config['X-PRIVATE-KEY'], process.env.PAYDUNYA_PRIVATE_KEY);
         assert.strictEqual(setup.config['X-API-KEY'], process.env.PAYDUNYA_PUBLIC_KEY);
        assert.strictEqual(setup.config['X-SECRET-KEY'], process.env.PAYDUNYA_TOKEN);
        done();
    });

    it('should initialize with given data', function (done){
        var setup = new Setup({
            marchandKey: 'master',
            privateKey: 'tpk_48e0bc2c9a8c3a0de4bbd69cba08e7216742adcd6cb8a504db606baa4ee87f97',
            publicKey: "f62e6daef938faa9ac4bdaeff8728513eee3f546af8700415bcac9e8bf234920",
            secret: 'tsk_ecd5dde8f5081b6387d3d0da7c11b02c14b9ec897c70907614b4fa0f1db698a2'
        });
        assert.strictEqual(setup.config['X-MARCHAND-KEY'], 'master');
        assert.strictEqual(setup.config['X-PRIVATE-KEY'], 'tpk_48e0bc2c9a8c3a0de4bbd69cba08e7216742adcd6cb8a504db606baa4ee87f97');
         assert.strictEqual(setup.config['X-API-KEY'], "f62e6daef938faa9ac4bdaeff8728513eee3f546af8700415bcac9e8bf234920");
        assert.strictEqual(setup.config['X-SECRET-KEY'], "tsk_ecd5dde8f5081b6387d3d0da7c11b02c14b9ec897c70907614b4fa0f1db698a2");
        done();
    });

    it('should set to sandbox base url as endpoint in test mode', function (done){
        var setup = new Setup({mode: 'sandbox'});
        assert.strictEqual(setup.baseURL, 'https://webservices.intram.org:4002/api/v1/');
        done();
    });

    it('should set live baseURL when mode !== "sandbox"', function (done){
        var setup = new Setup();
        assert.strictEqual(setup.baseURL, 'https://webservices.intram.org:4002/api/v1/');
        done();
    });
});
