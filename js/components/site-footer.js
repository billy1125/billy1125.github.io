class SiteFooter extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
<strong>本站所提供的資料，均由<a href='https://data.gov.tw/'>政府資料開放平臺</a>所提供之公開資料集所分析整理繪製，僅供參考。實際鐵路運行情況請以現場、各鐵路與軌道系統的管理單位所公布資訊為準。</strong>
<p style='text-align:center'>
    <a href='privacy.html'>隱私權政策</a> ｜ <a href='terms.html'>使用者條款</a>
</p>
<p style='text-align:center'>
    本網站採 <a href='https://tw.creativecommons.net/home-page/'>CC 姓名標示－非商業性－禁止改作</a> 授權。姓名標示請使用「台灣鐵路/軌道運行圖」或「呂卓勳 Cho-Hsun Lu」。
</p>`;
    }
}

customElements.define('site-footer', SiteFooter);
