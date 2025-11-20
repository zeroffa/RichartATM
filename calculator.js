// **速算金額列表 (JPY)**
const QUICK_AMOUNTS = [
    5000, 10000, 30000, 60000, 100000, 260000, 500000, 1000000
];
const MIN_FEE = 100;

// 核心計算函數 (計算單一輸入框的結果)
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
        // 無效時，也清除速算區的內容
        document.getElementById('quickCalculation').innerHTML = ""; 
        return;
    }

    // --- Richart 手續費計算 ---
    const feePreliminary = amount * (spotRate - cashRate) * 0.5;
    const actualFee = Math.max(MIN_FEE, feePreliminary);
    
    // --- Richart 總成本計算 ---
    const totalOriginalCost = amount * cost;
    const totalExpense = totalOriginalCost + actualFee;
    const totalCostPerUnit = totalExpense / amount;

    // --- 外部結匯成本比較 ---
    const externalCost = amount * compareRate;
    const savings = externalCost - totalExpense;

    // 6. 顯示結果 (使用新的 CSS class 進行顏色標示)
    resultsContainer.innerHTML = `
        <p>實際提領手續費：<span class="result-value">${actualFee.toFixed(2)}</span> 台幣</p>
        <p>納入手續費後，日圓**單位總成本**：<span class="final-cost">${totalCostPerUnit.toFixed(6)}</span> NTD/JPY</p>
        <hr>
        <p>外部結匯總成本 ($<span class="result-value">${compareRate.toFixed(4)}</span>)：<span class="result-value">${externalCost.toFixed(2)}</span> 台幣</p>
        <p><strong> Richart 提領節省金額：<span class="final-savings">${savings.toFixed(2)}</span> 台幣 (若為負值則表示較貴)</strong></p>
    `;

    // **呼叫速算表格生成**
    calculateQuickTable(cost, spotRate, cashRate);
}

// **新增：計算並顯示速算表格**
function calculateQuickTable(cost, spotRate, cashRate) {
    const quickCalculationDiv = document.getElementById('quickCalculation');
    const exchangeDiff = spotRate - cashRate; // 匯率差額
    const feeRatio = 0.5;
    
    let tableHTML = `
        <table class="quick-calc-table">
            <thead>
                <tr>
                    <th>提領金額 (JPY)</th>
                    <th>手續費 (NTD)</th>
                    <th>攤提後單位總成本 (NTD/JPY)</th>
                </tr>
            </thead>
            <tbody>
    `;

    QUICK_AMOUNTS.forEach(amount => {
        // 1. 計算手續費
        const feePreliminary = amount * exchangeDiff * feeRatio;
        const actualFee = Math.max(MIN_FEE, feePreliminary);
        
        // 2. 計算攤提後的單位總成本
        const totalOriginalCost = amount * cost;
        const totalExpense = totalOriginalCost + actualFee;
        const totalCostPerUnit = totalExpense / amount;
        
        // 3. 檢查是否達到手續費門檻
        const feeNote = (actualFee > MIN_FEE) ? actualFee.toFixed(2) : `(${MIN_FEE.toFixed(2)} 最低)`;

        tableHTML += `
            <tr>
                <td>${amount.toLocaleString('en-US')}</td>
                <td class="fee-col">${feeNote}</td>
                <td class="unit-cost-col">${totalCostPerUnit.toFixed(6)}</td>
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
        </table>
        <p style="text-align:right; margin-top:10px;">* 手續費門檻 (超過 ${MIN_FEE} 元) 在匯率差 ${exchangeDiff.toFixed(4)} 時，約為 ${ (MIN_FEE / (exchangeDiff * feeRatio)).toFixed(0) } JPY。</p>
    `;

    quickCalculationDiv.innerHTML = tableHTML;
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

    const fullText = `--- JPY Cost Calc 結算結果 (V1.3) ---\n` +
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
            // 所有輸入變動時，呼叫 calculateCost (它內部會再呼叫 quickTable)
            inputElement.addEventListener('input', calculateCost); 
        }
    });

    calculateCost();
}

window.copyResults = copyResults;
window.onload = setupEventListeners;
