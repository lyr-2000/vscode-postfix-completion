

const regexp = /\{\{(.*?)\}\}/g;


/**
 *****************************************
 * 失败内容
 *****************************************
 */
function replace(str: string, handler: (matched: string) => string, quote = false): Promise<string> | string {
    if (str) {
        let matched = regexp.exec(str);
        let result = [];
        let idx = 0;
        let cached = new Map<string, string>()

        // 匹配成功
        while (matched) {

            // 添加结果
            result.push(str.slice(idx, matched.index));

            // 添加值
            let res0 = ''
            if (cached.has(matched[1])) {
                res0 = cached.get(matched[1]) || ''
            } else {
                res0 = handler(matched[1]) || ''
                if (quote) {
                    res0 = "\"" + res0.replace(/^["'](.+(?=["']$))["']$/, '$1') + "\"";
                }
            }
            result.push(res0);
            cached.set(matched[1], res0)

            // 更新位置
            idx = matched.index + matched[0].length;

            // 匹配下一项
            matched = regexp.exec(str);
        }

        // 返回结果
        return result.join('') + str.slice(idx);
    }

    // 返回默认值
    return str;
}


/** 
 *****************************************
 * 抛出接口
 *****************************************
 */
export default replace;

// assert.strictEqual(-1, [1, 2, 3].indexOf(5))
let s = replace("{{expr}}",(str)=> {
    return "helloworld"
})
// assert.strictEqual(s, "helloworld")
console.log(s)