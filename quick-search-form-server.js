export const query2Mongo = (query) => {
    ret = {};
    for(let key of Object.keys(query)){
        let seg = key.split('$');
        let k = seg[0];
        let mod = seg[1];
        if(k && _.include(['eq', 'lt', 'lte', 'gt', 'gte'], mod)){
            ret[k] = {};
            ret[k]['$'+mod] = query[key];
        }
    }
    return ret;
}