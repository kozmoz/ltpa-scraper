describe('scrape-services', function () {

    // const fs = require('fs');
    // const path = require('path');
    const service = require('./scrape-services');


    beforeEach(function () {
    });


    it('should trim excessive whitespace within the text', function () {
        let text = service._trimExcessiveWhitespace('  test  123 876\n');
        expect(text).toBe('test 123 876');
    });

    it('should trim start slash from url', function () {
        expect(service._trimStartSlash('///long/url/')).toBe('long/url/');
        expect(service._trimStartSlash('/long/url/')).toBe('long/url/');
        expect(service._trimStartSlash('long/url/')).toBe('long/url/');
        expect(service._trimStartSlash('long/url')).toBe('long/url');
    });

    it('should trim end slash from url', function () {
        expect(service._trimEndSlash('/long/url///')).toBe('/long/url');
        expect(service._trimEndSlash('///long/url/')).toBe('///long/url');
        expect(service._trimEndSlash('/long/url/')).toBe('/long/url');
        expect(service._trimEndSlash('long/url/')).toBe('long/url');
        expect(service._trimEndSlash('long/url')).toBe('long/url');
    });

});
