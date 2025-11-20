// 核心計算函數
function calculateCost() {
    // 1. 獲取使用者輸入的數值 (會讀取 HTML 中設定的預設值)
    const amount = parseFloat(document.getElementById('amount').value);
    const cost = parseFloat(document.getElementById('cost').value);
    const spotRate = parseFloat(document.getElementById('spotRate').value);
    const cashRate = parseFloat(document.getElementById('cashRate').value);
    const compareRate = parseFloat(document.getElementById('compareRate').value); // 取得比較匯率

    // 檢查輸入是否有效
    if (isNaN(amount) || isNaN(cost) || isNaN(spotRate) || isNaN(cashRate) || isNaN(compareRate) || amount <= 0) {
        alert("請輸入有效的數值！");
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
    document.getElementById('feeResult').innerText = actualFee.toFixed(2);
    document.getElementById('totalCostPerUnit').innerText = totalCostPerUnit.toFixed(6);
    document.getElementById('externalCost').innerText = externalCost.toFixed(2);
    document.getElementById('savings').innerText = savings.toFixed(2);
    document.getElementById('externalRate').innerText = compareRate.toFixed(4);
}

// 首次載入時執行一次計算
window.onload = calculateCost;
