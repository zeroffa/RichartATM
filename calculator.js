// 核心計算函數
function calculateCost() {
    // 1. 獲取使用者輸入的數值
    const amount = parseFloat(document.getElementById('amount').value);
    const cost = parseFloat(document.getElementById('cost').value);
    const spotRate = parseFloat(document.getElementById('spotRate').value);
    const cashRate = parseFloat(document.getElementById('cashRate').value);
    const compareRate = parseFloat(document.getElementById('compareRate').value); 

    const resultsContainer = document.getElementById('resultsContainer');
    
    // 簡單的輸入驗證
    if (isNaN(amount) || isNaN(cost) || isNaN(spotRate) || isNaN(cashRate) || isNaN(compareRate) || amount <= 0) {
        resultsContainer.innerHTML = `<p style="color:red;">請檢查所有數值輸入是否正確。</p>`;
        return;
    }

    // --- Richart 手續費計算 ---
    const feePreliminary = amount * (spotRate - cashRate) * 0.5;
    const MIN_FEE = 100;
    const actualFee = Math.max(MIN_FEE, feePreliminary);
    
    // --- Richart 總成本計算 ---
    const totalOriginalCost = amount * cost;
    const totalExpense = totalOriginalCost + actualFee;
    const totalCostPerUnit = totalExpense / amount;

    // --- 外部結匯成本比較 ---
    const externalCost = amount * compareRate;
    const savings = externalCost - totalExpense;

    // 6. 顯示結果 (使用新的 CSS class 進行顏色標示)
    // 注意：savings 的顏色將由 CSS Class (final-savings) 決定
    resultsContainer.innerHTML = `
        <p>實際提領手續費：<span class="result-value">${actualFee.toFixed(2)}</span> 台幣</p>
        <p>納入手續費後，日圓**單位總成本**：<span class="final-cost">${totalCostPerUnit.toFixed(6)}</span> NTD/JPY</p>
        <hr>
        <p>外部結匯總成本 ($<span class="result-value">${compareRate.toFixed(4)}</span>)：<span class="result-value">${externalCost.toFixed(2)}</span> 台幣</p>
        <p><strong> Richart 提領節省金額：<span class="final-savings">${savings.toFixed(2)}</span> 台幣 (若為負值則表示較貴)</strong></p>
    `;
}

// **複製結果內容到剪貼簿 (功能不變)**
function copyResults() {
    const resultsContainer = document.getElementById('resultsContainer');
    const resultsText = resultsContainer.innerText;

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
        alert('您的瀏覽器不支援自動複製功能，請手動複製！');
    }
}


// 設定即時監聽事件
function setupEventListeners() {
    const inputIds = ['amount', 'cost', 'spotRate', 'cashRate', 'compareRate'];
    
    inputIds.forEach(id => {
        const inputElement = document.getElementById(id);
        if (inputElement) {
            inputElement.addEventListener('input', calculateCost);
        }
    });

    calculateCost();
}

window.copyResults = copyResults;
window.onload = setupEventListeners;
