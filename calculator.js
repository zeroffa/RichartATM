// 核心計算函數
function calculateCost() {
    // 1. 獲取使用者輸入的數值
    const amount = parseFloat(document.getElementById('amount').value);
    const cost = parseFloat(document.getElementById('cost').value);
    const spotRate = parseFloat(document.getElementById('spotRate').value);
    const cashRate = parseFloat(document.getElementById('cashRate').value);
    const compareRate = parseFloat(document.getElementById('compareRate').value); 

    // 獲取結果顯示區的容器
    const resultsContainer = document.getElementById('resultsContainer');
    
    // 簡單的輸入驗證：檢查是否有無效或非數字輸入
    if (isNaN(amount) || isNaN(cost) || isNaN(spotRate) || isNaN(cashRate) || isNaN(compareRate) || amount <= 0) {
        // 輸入無效時，清空結果區並顯示錯誤提示
        resultsContainer.innerHTML = `<p style="color:red;">請檢查所有數值輸入是否正確。</p>`;
        return;
    }

    // --- Richart 手續費計算 ---
    
    // 2. 計算手續費初算金額: 提領金額 * (即期 - 現鈔) * 0.5
    const feePreliminary = amount * (spotRate - cashRate) * 0.5;
    
    // 3. 計算實際手續費 (套用最低收費 NT$100)
    const MIN_FEE = 100;
    const actualFee = Math.max(MIN_FEE, feePreliminary);
    
    // --- Richart 總成本計算 ---
    
    // 4. 計算攤提後的總成本: (原始買入總成本 + 實際手續費) / 提領金額
    const totalOriginalCost = amount * cost;
    const totalExpense = totalOriginalCost + actualFee;
    const totalCostPerUnit = totalExpense / amount;

    // --- 外部結匯成本比較 ---
    
    // 5. 外部結匯成本
    const externalCost = amount * compareRate;
    const savings = externalCost - totalExpense;

    // 6. 顯示結果 (四捨五入到小數點第二位或第六位)
    resultsContainer.innerHTML = `
        <p>實際提領手續費：<strong id="feeResult">${actualFee.toFixed(2)}</strong> 台幣</p>
        <p>納入手續費後，日圓**單位總成本**：<strong id="totalCostPerUnit">${totalCostPerUnit.toFixed(6)}</strong> NTD/JPY</p>
        <hr>
        <p>外部結匯總成本 ($<span id="externalRate">${compareRate.toFixed(4)}</span>)：<strong id="externalCost">${externalCost.toFixed(2)}</strong> 台幣</p>
        <p><strong> Richart 提領節省金額：<strong id="savings">${savings.toFixed(2)}</strong> 台幣 (若為負值則表示較貴)</strong></p>
    `;

}

// **新增：複製結果內容到剪貼簿**
function copyResults() {
    const resultsContainer = document.getElementById('resultsContainer');
    
    // 取得所有結果文字
    const resultsText = resultsContainer.innerText;

    // 獲取輸入值以創建完整的複製內容
    const amount = document.getElementById('amount').value;
    const cost = document.getElementById('cost').value;
    const spotRate = document.getElementById('spotRate').value;
    const cashRate = document.getElementById('cashRate').value;
    const compareRate = document.getElementById('compareRate').value;

    const fullText = `--- JPY Cost Calc 結算結果 ---\n` +
                     `提領日圓金額: ${amount} JPY\n` +
                     `原始買進成本: ${cost} NTD/JPY\n` +
                     `即期匯率: ${spotRate} / 現鈔匯率: ${cashRate}\n` +
                     `外部結匯比較匯率: ${compareRate} NTD/JPY\n` +
                     `--------------------------\n` +
                     resultsText;

    // 嘗試將文字複製到剪貼簿 (現代瀏覽器)
    if (navigator.clipboard) {
        navigator.clipboard.writeText(fullText)
            .then(() => {
                alert('計算結果已複製到剪貼簿！');
            })
            .catch(err => {
                console.error('無法複製文字:', err);
                alert('複製失敗，請手動複製！');
            });
    } else {
        // 舊瀏覽器或不支援 navigator.clipboard 的情況
        alert('您的瀏覽器不支援自動複製功能，請手動複製！');
    }
}


// **設定即時監聽事件**
function setupEventListeners() {
    // 獲取所有需要監聽的輸入框 ID
    const inputIds = ['amount', 'cost', 'spotRate', 'cashRate', 'compareRate'];
    
    inputIds.forEach(id => {
        const inputElement = document.getElementById(id);
        if (inputElement) {
            // 使用 'input' 事件，只要輸入框內容變動就觸發 calculateCost
            inputElement.addEventListener('input', calculateCost);
        }
    });

    // 確保頁面載入時執行一次計算，顯示預設值結果
    calculateCost();
}

// 將 copyResults 函式暴露給 HTML 呼叫
window.copyResults = copyResults;

// 頁面載入完成後，執行事件設置
window.onload = setupEventListeners;
