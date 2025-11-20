// 核心計算函數
function calculateCost() {
    // 1. 獲取使用者輸入的數值
    const amount = parseFloat(document.getElementById('amount').value);
    const cost = parseFloat(document.getElementById('cost').value);
    const spotRate = parseFloat(document.getElementById('spotRate').value);
    const cashRate = parseFloat(document.getElementById('cashRate').value);
    const compareRate = parseFloat(document.getElementById('compareRate').value); 

    // 簡單的輸入驗證：檢查是否有無效或非數字輸入
    if (isNaN(amount) || isNaN(cost) || isNaN(spotRate) || isNaN(cashRate) || isNaN(compareRate) || amount <= 0) {
        // 輸入無效時，清空結果區並顯示錯誤提示
        document.getElementById('feeResult').innerText = "請檢查所有數值輸入是否正確";
        document.getElementById('totalCostPerUnit').innerText = "";
        document.getElementById('externalCost').innerText = "";
        document.getElementById('savings').innerText = "";
        document.getElementById('externalRate').innerText = "";
        return;
    }

    // --- Richart 手續費計算 ---
    
    // 2. 計算手續費初算金額: 提領金額 * (即期 - 現鈔) * 0.5
    // 注意：這裡假設 C1 > D1，否則會出現負值 (實際計算中即期通常會高於現鈔)
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

// 頁面載入完成後，執行事件設置
window.onload = setupEventListeners;
