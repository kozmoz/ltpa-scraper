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

    it('should parse the cookie header', function () {
        const cookie = [
            'WASReqURL=""; Expires=Thu, 01-Dec-94 16:00:00 GMT; Path=/; HttpOnly',
            'LtpaToken2=EPBg/ahVx0LXue+fwP8it1NR87y7vKlbxAczk5qi0D1tHIgIaNs+Wr3UF5y29IHL6xqcThqc0HK7kbDjuLFk51H3tLfWv72lh+J5Fa9SqFph/2Jl7tauE0+aood++a+H+oOnBPWBz8RuSHZyuMrw5WVee7cRbNxCpaEBWTLVDV3Wt9COSNit2Mts+0nuSuBYDwiPUGxwL2kV3DDYFbcgxslGwPOx5TMIL4vFRQ4jEMxl6eg2M/tirvCsP+3eVxcbUk8+BXAMxHu+DyNIytNjR2RkYqFDTU9SbnsIg54G72f+FyVaKsObL/cAnWnmeKK3/+Y1k1pNUdHqRjpfZAael1gvJaH9CeO8SzfG2UJTuSKpaLkSzrXWDliaLWiUcLV3xrp/RMoscIkYi+2bKK4FQfL2vUPBjLhcED9w8taJLTw9v8AbHg9fKqzFPZA+bUGA4HK25X2m1M98a+aODQt6ixsWo+HPbVJdBRSthU2qscQTgLnW/6wQd17KVZ19M1kNywTawiyGIpefxgQR0uDgEg7p/EfooCiYkONwvbwPr8TmI8dCt6pDb0Y5xOalSnp9Pxyd1wIJS2l9SnL7HvMNlwA+zlGmcs1a2+dhP819s6Iag1941L10EpnLuQcGId0ugS+Vx4eXwtXvI3O4AK1Yj93djJSgELcblvA8/9awYVm5LB4bI9hIe9+AtxutBTzJOyS4v7wDoArB5AJLXvRKqba6TJGQLMsTTde1CSS43uA=; Path=/; Domain=.ont.xxx.nl; HttpOnly',
            'JSESSIONID=0000tCpWj6q-5kCiGSQ4uJRT9hp:1d0cq5mdh; Path=/; HttpOnly',
            'WASReqURL=""; Expires=Thu, 01-Dec-94 16:00:00 GMT; Path=/',
            'WASReqURL=""; Expires=Thu, 01-Dec-94 16:00:00 GMT; Path=/; HttpOnly',
            'LtpaToken2=EPBg/ahVx0LXue+fwP8it1NR87y7vKlbxAczk5qi0D1tHIgIaNs+Wr3UF5y29IHL6xqcThqc0HK7kbDjuLFk51H3tLfWv72lh+J5Fa9SqFph/2Jl7tauE0+aood++a+H+oOnBPWBz8RuSHZyuMrw5WVee7cRbNxCpaEBWTLVDV3Wt9COSNit2Mts+0nuSuBYDwiPUGxwL2kV3DDYFbcgxslGwPOx5TMIL4vFRQ4jEMxl6eg2M/tirvCsP+3eVxcbUk8+BXAMxHu+DyNIytNjR2RkYqFDTU9SbnsIg54G72f+FyVaKsObL/cAnWnmeKK3/+Y1k1pNUdHqRjpfZAael1gvJaH9CeO8SzfG2UJTuSKpaLkSzrXWDliaLWiUcLV3xrp/RMoscIkYi+2bKK4FQfL2vUPBjLhcED9w8taJLTw9v8AbHg9fKqzFPZA+bUGA4HK25X2m1M98a+aODQt6ixsWo+HPbVJdBRSthU2qscQTgLnW/6wQd17KVZ19M1kNywTawiyGIpefxgQR0uDgEg7p/EfooCiYkONwvbwPr8TmI8dCt6pDb0Y5xOalSnp9Pxyd1wIJS2l9SnL7HvMNlwA+zlGmcs1a2+dhP819s6Iag1941L10EpnLuQcGId0ugS+Vx4eXwtXvI3O4AK1Yj93djJSgELcblvA8/9awYVm5LB4bI9hIe9+AtxutBTzJOyS4v7wDoArB5AJLXvRKqba6TJGQLMsTTde1CSS43uA=; Path=/; Domain=.ont.xxx.nl; HttpOnly',
            'WASReqURL=""; Expires=Thu, 01-Dec-94 16:00:00 GMT; Path=/'
        ];
        const parsed = service._parseCookieValues(cookie);
        expect(parsed['LtpaToken2']).toBe('EPBg/ahVx0LXue+fwP8it1NR87y7vKlbxAczk5qi0D1tHIgIaNs+Wr3UF5y29IHL6xqcThqc0HK7kbDjuLFk51H3tLfWv72lh+J5Fa9SqFph/2Jl7tauE0+aood++a+H+oOnBPWBz8RuSHZyuMrw5WVee7cRbNxCpaEBWTLVDV3Wt9COSNit2Mts+0nuSuBYDwiPUGxwL2kV3DDYFbcgxslGwPOx5TMIL4vFRQ4jEMxl6eg2M/tirvCsP+3eVxcbUk8+BXAMxHu+DyNIytNjR2RkYqFDTU9SbnsIg54G72f+FyVaKsObL/cAnWnmeKK3/+Y1k1pNUdHqRjpfZAael1gvJaH9CeO8SzfG2UJTuSKpaLkSzrXWDliaLWiUcLV3xrp/RMoscIkYi+2bKK4FQfL2vUPBjLhcED9w8taJLTw9v8AbHg9fKqzFPZA+bUGA4HK25X2m1M98a+aODQt6ixsWo+HPbVJdBRSthU2qscQTgLnW/6wQd17KVZ19M1kNywTawiyGIpefxgQR0uDgEg7p/EfooCiYkONwvbwPr8TmI8dCt6pDb0Y5xOalSnp9Pxyd1wIJS2l9SnL7HvMNlwA+zlGmcs1a2+dhP819s6Iag1941L10EpnLuQcGId0ugS+Vx4eXwtXvI3O4AK1Yj93djJSgELcblvA8/9awYVm5LB4bI9hIe9+AtxutBTzJOyS4v7wDoArB5AJLXvRKqba6TJGQLMsTTde1CSS43uA=');
        expect(parsed['JSESSIONID']).toBe('0000tCpWj6q-5kCiGSQ4uJRT9hp:1d0cq5mdh');
    });

});
