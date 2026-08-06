// ========================================
// DomPin - Dompet Pintar JavaScript
// Expense & Budget Visualizer
// ========================================

console.log('DomPin loaded successfully! 👛');

// ========================================
// 1. CONSTANTS & CONFIG
// ========================================

const STORAGE_KEYS = {
    TRANSACTIONS: 'dompin_transactions',
    CATEGORIES: 'dompin_categories',
    SETTINGS: 'dompin_settings'
};

const DEFAULT_CATEGORIES = [
    { id: 'food', name: 'Food', emoji: '🍕', budget: 1500000, color: '#FF6B6B' },
    { id: 'transport', name: 'Transport', emoji: '🚗', budget: 1000000, color: '#4ECDC4' },
    { id: 'fun', name: 'Fun', emoji: '🧋', budget: 800000, color: '#FFD93D' }
];

const DEFAULT_SETTINGS = {
    theme: 'light',
    monthlyBudget: 3500000,
    spendingLimit: 3500000,
    currentPeriod: new Date().toISOString().slice(0, 7) // YYYY-MM format
};

// ========================================
// 2. STATE MANAGEMENT
// ========================================

let state = {
    transactions: [],
    categories: [],
    settings: {},
    currentPage: 'home',
    currentPeriod: new Date().toISOString().slice(0, 7)
};

// ========================================
// 3. STORAGE HELPERS
// ========================================

const Storage = {
    /**
     * Get data from localStorage
     * @param {string} key - Storage key
     * @returns {any} Parsed data or null
     */
    get: (key) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error(`Error reading from localStorage (${key}):`, error);
            return null;
        }
    },
    
    /**
     * Set data to localStorage
     * @param {string} key - Storage key
     * @param {any} value - Data to store
     */
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(`Error writing to localStorage (${key}):`, error);
            if (error.name === 'QuotaExceededError') {
                alert('Storage limit exceeded. Please clear some data.');
            }
        }
    },
    
    /**
     * Remove data from localStorage
     * @param {string} key - Storage key
     */
    remove: (key) => {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error(`Error removing from localStorage (${key}):`, error);
        }
    },
    
    /**
     * Clear all data from localStorage
     */
    clear: () => {
        try {
            // Clear only DomPin data
            Object.values(STORAGE_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
        } catch (error) {
            console.error('Error clearing localStorage:', error);
        }
    }
};

// ========================================
// 4. UTILITY FUNCTIONS
// ========================================

/**
 * Format number to Indonesian Rupiah
 * @param {number} amount - Amount to format
 * @returns {string} Formatted Rupiah string
 */
function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

/**
 * Format number to abbreviated form (e.g., 4.5M, 150K)
 * @param {number} amount - Amount to format
 * @returns {string} Abbreviated string
 */
function formatRupiahShort(amount) {
    if (amount >= 1000000) {
        return `Rp ${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
        return `Rp ${(amount / 1000).toFixed(0)}K`;
    }
    return formatRupiah(amount);
}

/**
 * Format date to Indonesian format
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(new Date(date));
}

/**
 * Format date to relative time (Hari ini, Kemarin, or full date)
 * @param {string|Date} date - Date to format
 * @returns {string} Relative time string
 */
function formatRelativeTime(date) {
    const now = new Date();
    const inputDate = new Date(date);
    
    // Reset time to midnight for accurate day comparison
    now.setHours(0, 0, 0, 0);
    inputDate.setHours(0, 0, 0, 0);
    
    const diffTime = now - inputDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hari ini';
    if (diffDays === 1) return 'Kemarin';
    if (diffDays < 7) return `${diffDays} hari lalu`;
    
    return formatDate(date);
}

/**
 * Format time (HH:MM)
 * @param {string|Date} date - Date to format
 * @returns {string} Time string
 */
function formatTime(date) {
    return new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).format(new Date(date));
}

/**
 * Get month name from YYYY-MM string
 * @param {string} monthString - Month string (YYYY-MM)
 * @returns {string} Month name and year
 */
function getMonthName(monthString) {
    const [year, month] = monthString.split('-');
    const date = new Date(year, parseInt(month) - 1, 1);
    return new Intl.DateTimeFormat('id-ID', {
        month: 'long',
        year: 'numeric'
    }).format(date);
}

/**
 * Calculate total amount from transactions
 * @param {Array} transactions - Array of transaction objects
 * @returns {number} Total amount
 */
function calculateTotal(transactions) {
    return transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
}

/**
 * Group transactions by category and calculate totals
 * @param {Array} transactions - Array of transaction objects
 * @returns {Object} Object with category IDs as keys and totals as values
 */
function groupByCategory(transactions) {
    const grouped = {};
    
    transactions.forEach(transaction => {
        const categoryId = transaction.category;
        if (!grouped[categoryId]) {
            grouped[categoryId] = 0;
        }
        grouped[categoryId] += transaction.amount;
    });
    
    return grouped;
}

/**
 * Calculate percentage
 * @param {number} part - Part value
 * @param {number} whole - Whole value
 * @returns {number} Percentage (0-100+)
 */
function calculatePercentage(part, whole) {
    if (whole === 0) return 0;
    return Math.round((part / whole) * 100);
}

/**
 * Generate unique ID
 * @returns {string} Unique ID
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * Validate transaction input
 * @param {string} name - Item name
 * @param {number} amount - Amount
 * @param {string} category - Category ID
 * @returns {Object} Validation result {valid: boolean, error: string}
 */
function validateTransaction(name, amount, category) {
    if (!name || name.trim() === '') {
        return { valid: false, error: 'Nama barang harus diisi' };
    }
    
    if (!amount || amount <= 0) {
        return { valid: false, error: 'Jumlah harus lebih dari 0' };
    }
    
    if (!category || category === '') {
        return { valid: false, error: 'Kategori harus dipilih' };
    }
    
    return { valid: true, error: null };
}

/**
 * Sort transactions by different criteria
 * @param {Array} transactions - Array of transactions
 * @param {string} sortBy - Sort method (newest, highest, lowest, category)
 * @returns {Array} Sorted transactions
 */
function sortTransactions(transactions, sortBy) {
    const sorted = [...transactions]; // Create copy to avoid mutation
    
    switch(sortBy) {
        case 'newest':
            return sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        case 'highest':
            return sorted.sort((a, b) => b.amount - a.amount);
        
        case 'lowest':
            return sorted.sort((a, b) => a.amount - b.amount);
        
        case 'category':
            return sorted.sort((a, b) => {
                const categoryA = state.categories.find(c => c.id === a.category);
                const categoryB = state.categories.find(c => c.id === b.category);
                const nameA = categoryA ? categoryA.name : '';
                const nameB = categoryB ? categoryB.name : '';
                return nameA.localeCompare(nameB);
            });
        
        default:
            return sorted;
    }
}

/**
 * Get category by ID
 * @param {string} categoryId - Category ID
 * @returns {Object|null} Category object or null
 */
function getCategoryById(categoryId) {
    return state.categories.find(c => c.id === categoryId) || null;
}

/**
 * Filter transactions by period (YYYY-MM)
 * @param {Array} transactions - Array of transactions
 * @param {string} period - Period string (YYYY-MM)
 * @returns {Array} Filtered transactions
 */
function filterByPeriod(transactions, period) {
    return transactions.filter(t => t.date.startsWith(period));
}

/**
 * Get available periods from transactions
 * @param {Array} transactions - Array of transactions
 * @returns {Array} Array of unique periods (YYYY-MM) sorted descending
 */
function getAvailablePeriods(transactions) {
    const periods = new Set();
    
    transactions.forEach(t => {
        const period = t.date.slice(0, 7); // Get YYYY-MM
        periods.add(period);
    });
    
    // Convert to array and sort descending (newest first)
    return Array.from(periods).sort().reverse();
}

// ========================================
// 5. DATA OPERATIONS
// ========================================

/**
 * Load all data from localStorage
 */
function loadData() {
    console.log('Loading data from localStorage...');
    
    // Load transactions
    const transactions = Storage.get(STORAGE_KEYS.TRANSACTIONS);
    state.transactions = transactions || [];
    
    // Load categories (use defaults if not found)
    const categories = Storage.get(STORAGE_KEYS.CATEGORIES);
    state.categories = categories || [...DEFAULT_CATEGORIES];
    
    // Load settings (use defaults if not found)
    const settings = Storage.get(STORAGE_KEYS.SETTINGS);
    state.settings = settings || { ...DEFAULT_SETTINGS };
    
    // Update current period from settings
    state.currentPeriod = state.settings.currentPeriod || state.currentPeriod;
    
    // If this is first load, save defaults
    if (!categories) {
        Storage.set(STORAGE_KEYS.CATEGORIES, state.categories);
        console.log('Saved default categories');
    }
    
    if (!settings) {
        Storage.set(STORAGE_KEYS.SETTINGS, state.settings);
        console.log('Saved default settings');
    }
    
    console.log('Data loaded:', {
        transactions: state.transactions.length,
        categories: state.categories.length,
        settings: state.settings
    });
}

/**
 * Save all data to localStorage
 */
function saveData() {
    try {
        Storage.set(STORAGE_KEYS.TRANSACTIONS, state.transactions);
        Storage.set(STORAGE_KEYS.CATEGORIES, state.categories);
        Storage.set(STORAGE_KEYS.SETTINGS, state.settings);
        console.log('Data saved successfully');
    } catch (error) {
        console.error('Error saving data:', error);
    }
}

/**
 * Add a new transaction
 * @param {Object} transaction - Transaction object
 */
function addTransaction(transaction) {
    state.transactions.push(transaction);
    Storage.set(STORAGE_KEYS.TRANSACTIONS, state.transactions);
    console.log('Transaction added:', transaction);
}

/**
 * Delete a transaction by ID
 * @param {string} id - Transaction ID
 */
function deleteTransaction(id) {
    state.transactions = state.transactions.filter(t => t.id !== id);
    Storage.set(STORAGE_KEYS.TRANSACTIONS, state.transactions);
    console.log('Transaction deleted:', id);
}

/**
 * Add a new category
 * @param {Object} category - Category object
 */
function addCategory(category) {
    state.categories.push(category);
    Storage.set(STORAGE_KEYS.CATEGORIES, state.categories);
    console.log('Category added:', category);
}

/**
 * Delete a category by ID
 * @param {string} id - Category ID
 */
function deleteCategory(id) {
    // Check if category is used in transactions
    const isUsed = state.transactions.some(t => t.category === id);
    
    if (isUsed) {
        alert('Tidak dapat menghapus kategori yang masih digunakan dalam transaksi.');
        return false;
    }
    
    state.categories = state.categories.filter(c => c.id !== id);
    Storage.set(STORAGE_KEYS.CATEGORIES, state.categories);
    console.log('Category deleted:', id);
    return true;
}

/**
 * Update settings
 * @param {Object} newSettings - New settings to merge
 */
function updateSettings(newSettings) {
    state.settings = { ...state.settings, ...newSettings };
    Storage.set(STORAGE_KEYS.SETTINGS, state.settings);
    console.log('Settings updated:', newSettings);
}

// ========================================
// 6. NAVIGATION SYSTEM
// ========================================

/**
 * Navigate to a specific page
 * @param {string} pageName - The page to navigate to (home, analysis, budgets, settings)
 */
function navigateTo(pageName) {
    console.log(`Navigating to: ${pageName}`);
    
    // Hide all pages
    const allPages = document.querySelectorAll('.page');
    allPages.forEach(page => {
        page.classList.remove('active');
    });
    
    // Show target page
    const targetPage = document.getElementById(`page-${pageName}`);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // Update navigation buttons
    const allNavButtons = document.querySelectorAll('.nav-btn');
    allNavButtons.forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeNavButton = document.querySelector(`.nav-btn[data-page="${pageName}"]`);
    if (activeNavButton) {
        activeNavButton.classList.add('active');
    }
    
    // Update state
    state.currentPage = pageName;
    
    // Render page-specific content
    renderCurrentPage();
}

/**
 * Render content for the current page
 */
function renderCurrentPage() {
    switch(state.currentPage) {
        case 'home':
            renderHomePage();
            break;
        case 'analysis':
            renderAnalysisPage();
            break;
        case 'budgets':
            renderBudgetsPage();
            break;
        case 'settings':
            renderSettingsPage();
            break;
    }
}

// ========================================
// 7. UI RENDERING FUNCTIONS
// ========================================

// Chart instances
let pieChartInstance = null;
let lineChartInstance = null;

/**
 * Render home page
 */
function renderHomePage() {
    populateCategoryDropdown();
    renderPeriodSelector();
    updateTotalBalance();
    updatePreviousMonth();
    checkSpendingLimit();
    renderTransactionList();
    renderPieChart();
    // Other home page rendering will be added in subsequent tasks
}

/**
 * Populate category dropdown in the form
 */
function populateCategoryDropdown() {
    const categorySelect = document.getElementById('itemCategory');
    if (!categorySelect) return;
    
    // Clear existing options
    categorySelect.innerHTML = '';
    
    // Add placeholder option
    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = 'Pilih kategori';
    placeholderOption.disabled = true;
    placeholderOption.selected = true;
    categorySelect.appendChild(placeholderOption);
    
    // Add category options
    state.categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = `${category.emoji} ${category.name}`;
        categorySelect.appendChild(option);
    });
    
    console.log('Category dropdown populated with', state.categories.length, 'categories');
}

/**
 * Render period selector dropdown
 */
function renderPeriodSelector() {
    const periodSelect = document.getElementById('periodSelect');
    if (!periodSelect) return;
    
    // Get available periods from transactions
    let periods = getAvailablePeriods(state.transactions);
    
    // Always include current period even if no transactions
    const currentPeriod = new Date().toISOString().slice(0, 7);
    if (!periods.includes(currentPeriod)) {
        periods.unshift(currentPeriod);
    }
    
    // Clear existing options
    periodSelect.innerHTML = '';
    
    // Add period options
    periods.forEach(period => {
        const option = document.createElement('option');
        option.value = period;
        option.textContent = getMonthName(period);
        if (period === state.currentPeriod) {
            option.selected = true;
        }
        periodSelect.appendChild(option);
    });
    
    console.log('Period selector populated with', periods.length, 'periods');
}

/**
 * Render transaction list
 */
function renderTransactionList() {
    const listContainer = document.getElementById('transactionList');
    const emptyMessage = document.getElementById('emptyTransactionMessage');
    
    if (!listContainer || !emptyMessage) return;
    
    // Filter transactions by current period
    let transactions = filterByPeriod(state.transactions, state.currentPeriod);
    
    // Get current sort method
    const sortSelect = document.getElementById('sortSelect');
    const sortBy = sortSelect ? sortSelect.value : 'newest';
    
    // Sort transactions
    transactions = sortTransactions(transactions, sortBy);
    
    // Check if empty
    if (transactions.length === 0) {
        listContainer.style.display = 'none';
        emptyMessage.classList.remove('hidden');
        return;
    }
    
    // Hide empty message and show list
    emptyMessage.classList.add('hidden');
    listContainer.style.display = 'flex';
    
    // Clear existing content
    listContainer.innerHTML = '';
    
    // Render each transaction
    transactions.forEach(transaction => {
        const category = getCategoryById(transaction.category);
        const categoryName = category ? category.name : 'Unknown';
        
        const transactionItem = document.createElement('div');
        transactionItem.className = 'transaction-item';
        transactionItem.dataset.id = transaction.id;
        
        transactionItem.innerHTML = `
            <span class="emoji">${transaction.emoji}</span>
            <div class="details">
                <div class="name">${transaction.name}</div>
                <div class="meta">${categoryName} • ${formatRelativeTime(transaction.date)}, ${formatTime(transaction.date)}</div>
            </div>
            <div class="amount">-${formatRupiah(transaction.amount)}</div>
            <button class="delete-btn" data-id="${transaction.id}" aria-label="Hapus transaksi">
                <span class="material-icons">delete</span>
            </button>
        `;
        
        listContainer.appendChild(transactionItem);
    });
    
    console.log('Transaction list rendered with', transactions.length, 'items');
}

/**
 * Update total balance display
 */
function updateTotalBalance() {
    const balanceElement = document.getElementById('totalBalance');
    const percentageFill = document.getElementById('percentageFill');
    const percentageText = document.getElementById('percentageText');
    
    if (!balanceElement || !percentageFill || !percentageText) return;
    
    // Filter transactions by current period
    const transactions = filterByPeriod(state.transactions, state.currentPeriod);
    
    // Calculate total
    const total = calculateTotal(transactions);
    
    // Get monthly budget from settings
    const monthlyBudget = state.settings.monthlyBudget || 3500000;
    
    // Calculate percentage
    const percentage = calculatePercentage(total, monthlyBudget);
    
    // Update display
    balanceElement.textContent = formatRupiah(total);
    percentageFill.style.width = `${Math.min(percentage, 100)}%`;
    percentageText.textContent = `${percentage}%`;
    
    // Apply color based on percentage
    if (percentage < 70) {
        percentageFill.style.backgroundColor = 'white';
    } else if (percentage < 90) {
        percentageFill.style.backgroundColor = '#FEF3C7';
    } else {
        percentageFill.style.backgroundColor = '#FCA5A5';
    }
    
    console.log('Total balance updated:', formatRupiah(total), `(${percentage}%)`);
}

/**
 * Update previous month display
 */
function updatePreviousMonth() {
    const previousMonthElement = document.getElementById('previousMonthAmount');
    
    if (!previousMonthElement) return;
    
    // Calculate previous month period
    const [year, month] = state.currentPeriod.split('-').map(Number);
    const prevDate = new Date(year, month - 2, 1); // month - 2 because Date month is 0-indexed
    const prevPeriod = prevDate.toISOString().slice(0, 7);
    
    // Filter transactions by previous period
    const prevTransactions = filterByPeriod(state.transactions, prevPeriod);
    
    // Calculate total
    const prevTotal = calculateTotal(prevTransactions);
    
    // Update display
    previousMonthElement.textContent = formatRupiah(prevTotal);
    
    console.log('Previous month updated:', formatRupiah(prevTotal));
}

/**
 * Render pie chart for spending distribution
 */
function renderPieChart() {
    const canvas = document.getElementById('pieChart');
    const emptyMessage = document.getElementById('emptyChartMessage');
    
    if (!canvas || !emptyMessage) return;
    
    // Filter transactions by current period
    const transactions = filterByPeriod(state.transactions, state.currentPeriod);
    
    // Check if empty
    if (transactions.length === 0) {
        canvas.style.display = 'none';
        emptyMessage.classList.remove('hidden');
        
        // Destroy existing chart if any
        if (pieChartInstance) {
            pieChartInstance.destroy();
            pieChartInstance = null;
        }
        return;
    }
    
    // Show canvas and hide empty message
    canvas.style.display = 'block';
    emptyMessage.classList.add('hidden');
    
    // Group transactions by category
    const grouped = groupByCategory(transactions);
    
    // Prepare data for chart
    const labels = [];
    const data = [];
    const backgroundColor = [];
    
    Object.entries(grouped).forEach(([categoryId, amount]) => {
        const category = getCategoryById(categoryId);
        if (category) {
            labels.push(category.name);
            data.push(amount);
            backgroundColor.push(category.color);
        }
    });
    
    // Destroy existing chart
    if (pieChartInstance) {
        pieChartInstance.destroy();
    }
    
    // Create new chart
    const ctx = canvas.getContext('2d');
    
    pieChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColor,
                borderWidth: 2,
                borderColor: getComputedStyle(document.documentElement)
                    .getPropertyValue('--bg-card').trim() || '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 12,
                            family: getComputedStyle(document.body).fontFamily
                        },
                        color: getComputedStyle(document.documentElement)
                            .getPropertyValue('--text-primary').trim()
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${formatRupiah(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
    
    console.log('Pie chart rendered with', labels.length, 'categories');
}

/**
 * Check spending limit and show alert if exceeded
 */
function checkSpendingLimit() {
    const alertElement = document.getElementById('spendingAlert');
    
    if (!alertElement) return;
    
    // Filter transactions by current period
    const transactions = filterByPeriod(state.transactions, state.currentPeriod);
    
    // Calculate total
    const total = calculateTotal(transactions);
    
    // Get spending limit from settings
    const spendingLimit = state.settings.spendingLimit || state.settings.monthlyBudget || 3500000;
    
    // Calculate percentage
    const percentage = calculatePercentage(total, spendingLimit);
    
    // Show/hide alert based on percentage
    if (percentage > 100) {
        alertElement.classList.remove('hidden');
        console.log('Spending limit alert shown:', `${percentage}% of budget`);
    } else {
        alertElement.classList.add('hidden');
    }
}

/**
 * Render analysis page
 */
function renderAnalysisPage() {
    renderLineChart();
    renderResourceUsage();
}

/**
 * Render line chart for monthly spending trend
 */
function renderLineChart() {
    const canvas = document.getElementById('lineChart');
    const currentMonthSpend = document.getElementById('currentMonthSpend');
    const spendChange = document.getElementById('spendChange');
    
    if (!canvas) return;
    
    // Filter transactions by current period
    const transactions = filterByPeriod(state.transactions, state.currentPeriod);
    
    // Group by week
    const weeklyData = groupByWeek(transactions);
    
    // Calculate current month total
    const currentTotal = calculateTotal(transactions);
    
    // Calculate previous month for comparison
    const [year, month] = state.currentPeriod.split('-').map(Number);
    const prevDate = new Date(year, month - 2, 1);
    const prevPeriod = prevDate.toISOString().slice(0, 7);
    const prevTransactions = filterByPeriod(state.transactions, prevPeriod);
    const prevTotal = calculateTotal(prevTransactions);
    
    // Calculate change percentage
    let changePercentage = 0;
    let isDecrease = false;
    
    if (prevTotal > 0) {
        changePercentage = Math.abs(calculatePercentage(currentTotal - prevTotal, prevTotal));
        isDecrease = currentTotal < prevTotal;
    }
    
    // Update display
    if (currentMonthSpend) {
        currentMonthSpend.textContent = formatRupiahShort(currentTotal);
    }
    
    if (spendChange) {
        spendChange.textContent = `${isDecrease ? '-' : '+'}${changePercentage}%`;
        spendChange.className = 'spend-change';
        if (isDecrease) {
            spendChange.classList.add('positive');
        } else {
            spendChange.classList.add('negative');
        }
    }
    
    // Destroy existing chart
    if (lineChartInstance) {
        lineChartInstance.destroy();
    }
    
    // Find peak
    const maxWeek = weeklyData.reduce((max, week) => 
        week.total > max.total ? week : max, weeklyData[0] || { total: 0 });
    
    // Create new chart
    const ctx = canvas.getContext('2d');
    
    lineChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: weeklyData.map(w => w.label),
            datasets: [{
                label: 'Pengeluaran',
                data: weeklyData.map(w => w.total),
                borderColor: '#FFA500',
                backgroundColor: 'rgba(255, 165, 0, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 3,
                pointRadius: 5,
                pointBackgroundColor: '#FFA500',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            return `Pengeluaran: ${formatRupiah(context.parsed.y)}`;
                        }
                    }
                },
                annotation: maxWeek.total > 0 ? {
                    annotations: {
                        peakLine: {
                            type: 'line',
                            yMin: maxWeek.total,
                            yMax: maxWeek.total,
                            borderColor: '#F59E0B',
                            borderWidth: 2,
                            borderDash: [5, 5],
                            label: {
                                display: true,
                                content: `Peak: ${formatRupiahShort(maxWeek.total)}`,
                                backgroundColor: '#F59E0B',
                                color: '#fff',
                                font: {
                                    size: 11,
                                    weight: 'bold'
                                },
                                padding: 6
                            }
                        }
                    }
                } : undefined
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatRupiahShort(value);
                        },
                        color: getComputedStyle(document.documentElement)
                            .getPropertyValue('--text-secondary').trim()
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement)
                            .getPropertyValue('--border-color').trim()
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.documentElement)
                            .getPropertyValue('--text-secondary').trim()
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
    
    console.log('Line chart rendered with', weeklyData.length, 'weeks');
}

/**
 * Group transactions by week
 * @param {Array} transactions - Transactions to group
 * @returns {Array} Array of {label, total} objects
 */
function groupByWeek(transactions) {
    if (transactions.length === 0) {
        return [
            { label: 'Week 1', total: 0 },
            { label: 'Week 2', total: 0 },
            { label: 'Week 3', total: 0 },
            { label: 'Week 4', total: 0 }
        ];
    }
    
    const weeks = {};
    
    transactions.forEach(transaction => {
        const date = new Date(transaction.date);
        const dayOfMonth = date.getDate();
        
        // Determine week (1-4)
        let weekNum = Math.ceil(dayOfMonth / 7);
        if (weekNum > 4) weekNum = 4;
        
        const weekKey = `Week ${weekNum}`;
        
        if (!weeks[weekKey]) {
            weeks[weekKey] = 0;
        }
        
        weeks[weekKey] += transaction.amount;
    });
    
    // Ensure all 4 weeks are present
    const result = [];
    for (let i = 1; i <= 4; i++) {
        const key = `Week ${i}`;
        result.push({
            label: key,
            total: weeks[key] || 0
        });
    }
    
    return result;
}

/**
 * Render resource usage by category
 */
function renderResourceUsage() {
    const container = document.getElementById('resourceUsageList');
    
    if (!container) return;
    
    // Filter transactions by current period
    const transactions = filterByPeriod(state.transactions, state.currentPeriod);
    
    // Group by category
    const grouped = groupByCategory(transactions);
    
    // Clear existing content
    container.innerHTML = '';
    
    // Render each category
    state.categories.forEach(category => {
        const spent = grouped[category.id] || 0;
        const budget = category.budget || 1500000;
        const percentage = calculatePercentage(spent, budget);
        
        // Determine progress bar color
        let progressClass = 'low';
        if (percentage >= 90) {
            progressClass = 'high';
        } else if (percentage >= 70) {
            progressClass = 'medium';
        }
        
        const usageCard = document.createElement('div');
        usageCard.className = 'usage-card';
        
        usageCard.innerHTML = `
            <div class="usage-header">
                <span class="icon">${category.emoji}</span>
                <span class="name">${category.name}</span>
                <span class="percentage">${percentage}%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill ${progressClass}" style="width: ${Math.min(percentage, 100)}%"></div>
            </div>
            <div class="amounts">
                <span>${formatRupiah(spent)}</span>
                <span>Budget: ${formatRupiah(budget)}</span>
            </div>
        `;
        
        container.appendChild(usageCard);
    });
    
    console.log('Resource usage rendered with', state.categories.length, 'categories');
}

/**
 * Render budgets page
 */
function renderBudgetsPage() {
    renderMonthlyBudgetSetting();
    renderCategoryBudgets();
}

/**
 * Render monthly budget setting
 */
function renderMonthlyBudgetSetting() {
    const input = document.getElementById('monthlyBudgetInput');
    
    if (!input) return;
    
    // Set current value
    input.value = state.settings.monthlyBudget || 3500000;
}

/**
 * Render category budgets
 */
function renderCategoryBudgets() {
    const container = document.getElementById('categoryBudgetList');
    
    if (!container) return;
    
    // Clear existing content
    container.innerHTML = '';
    
    // Render each category
    state.categories.forEach(category => {
        const budgetItem = document.createElement('div');
        budgetItem.className = 'form-group';
        
        budgetItem.innerHTML = `
            <label for="budget-${category.id}">${category.emoji} ${category.name}</label>
            <input 
                type="number" 
                id="budget-${category.id}" 
                value="${category.budget || 1500000}" 
                min="0" 
                step="100000"
                data-category-id="${category.id}"
            >
        `;
        
        container.appendChild(budgetItem);
    });
    
    console.log('Category budgets rendered');
}

/**
 * Handle save monthly budget
 */
function handleSaveMonthlyBudget() {
    const input = document.getElementById('monthlyBudgetInput');
    
    if (!input) return;
    
    const newBudget = parseFloat(input.value);
    
    if (isNaN(newBudget) || newBudget <= 0) {
        alert('Budget harus lebih dari 0');
        return;
    }
    
    // Update settings
    updateSettings({ 
        monthlyBudget: newBudget,
        spendingLimit: newBudget
    });
    
    // Show notification
    showNotification('Budget bulanan berhasil diperbarui! 💰');
    
    // Re-render home page if needed
    if (state.currentPage === 'home') {
        renderHomePage();
    }
    
    console.log('Monthly budget updated:', newBudget);
}

/**
 * Handle save category budgets
 */
function handleSaveCategoryBudgets() {
    const inputs = document.querySelectorAll('#categoryBudgetList input');
    
    inputs.forEach(input => {
        const categoryId = input.dataset.categoryId;
        const newBudget = parseFloat(input.value);
        
        if (categoryId && !isNaN(newBudget) && newBudget > 0) {
            // Update category budget
            const categoryIndex = state.categories.findIndex(c => c.id === categoryId);
            if (categoryIndex !== -1) {
                state.categories[categoryIndex].budget = newBudget;
            }
        }
    });
    
    // Save to localStorage
    Storage.set(STORAGE_KEYS.CATEGORIES, state.categories);
    
    // Show notification
    showNotification('Budget kategori berhasil diperbarui! 📊');
    
    console.log('Category budgets updated');
}

/**
 * Render settings page
 */
function renderSettingsPage() {
    renderCategoryManagement();
}

/**
 * Render category management list
 */
function renderCategoryManagement() {
    const container = document.getElementById('categoryManagementList');
    
    if (!container) return;
    
    // Clear existing content
    container.innerHTML = '';
    
    // Render each category
    state.categories.forEach(category => {
        const categoryItem = document.createElement('div');
        categoryItem.className = 'category-item';
        
        categoryItem.innerHTML = `
            <div class="info">
                <span class="emoji">${category.emoji}</span>
                <span class="name">${category.name}</span>
            </div>
            <button class="delete-category-btn" data-category-id="${category.id}" aria-label="Hapus kategori">
                <span class="material-icons">delete</span>
            </button>
        `;
        
        container.appendChild(categoryItem);
    });
    
    console.log('Category management rendered with', state.categories.length, 'categories');
}

/**
 * Handle add new category
 */
// Daftar emoji pilihan untuk kategori
const CATEGORY_EMOJIS = [
    '🍕', '🍔', '☕', '🛒', '🚗', '🚌', '⛽', '🧋',
    '🎮', '🎬', '🎵', '📚', '💊', '🏥', '👕', '👟',
    '📱', '💡', '🏠', '💰', '🎁', '✈️', '🐾', '💇'
];

let selectedCategoryEmoji = null;

/**
 * Open the category modal and render emoji picker
 */
function openCategoryModal() {
    const modal = document.getElementById('categoryModal');
    const emojiGrid = document.getElementById('emojiGrid');
    const nameInput = document.getElementById('newCategoryName');

    if (!modal || !emojiGrid) return;

    // Reset state
    selectedCategoryEmoji = null;
    nameInput.value = '';
    emojiGrid.innerHTML = '';

    // Render emoji buttons
    CATEGORY_EMOJIS.forEach(emoji => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'emoji-btn';
        btn.textContent = emoji;
        btn.addEventListener('click', () => {
            selectedCategoryEmoji = emoji;
            document.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
        emojiGrid.appendChild(btn);
    });

    modal.classList.remove('hidden');
}

/**
 * Close the category modal
 */
function closeCategoryModal() {
    const modal = document.getElementById('categoryModal');
    if (modal) modal.classList.add('hidden');
}

/**
 * Confirm and save the new category
 */
function confirmAddCategory() {
    const nameInput = document.getElementById('newCategoryName');
    const name = nameInput.value.trim();

    if (!name) {
        alert('Nama kategori harus diisi');
        return;
    }

    if (!selectedCategoryEmoji) {
        alert('Pilih emoji untuk kategori');
        return;
    }

    const id = name.toLowerCase().replace(/\s+/g, '-');

    if (state.categories.some(c => c.id === id)) {
        alert('Kategori dengan nama ini sudah ada');
        return;
    }

    const newCategory = {
        id: id,
        name: name,
        emoji: selectedCategoryEmoji,
        budget: 1500000,
        color: '#' + Math.floor(Math.random() * 16777215).toString(16)
    };

    addCategory(newCategory);
    showNotification('Kategori baru berhasil ditambahkan! ✨');
    closeCategoryModal();
    renderSettingsPage();
    populateCategoryDropdown();

    console.log('New category added:', newCategory);
}

/**
 * Handle delete category
 * @param {string} categoryId - Category ID to delete
 */
function handleDeleteCategory(categoryId) {
    const category = getCategoryById(categoryId);
    
    if (!category) {
        alert('Kategori tidak ditemukan');
        return;
    }
    
    const confirmDelete = confirm(`Yakin ingin menghapus kategori "${category.name}"?`);
    
    if (!confirmDelete) {
        return;
    }
    
    // Try to delete
    const success = deleteCategory(categoryId);
    
    if (success) {
        // Show notification
        showNotification('Kategori berhasil dihapus! 🗑️');
        
        // Re-render
        renderSettingsPage();
        
        // Update dropdowns
        populateCategoryDropdown();
    }
}

/**
 * Handle export data
 */
function handleExportData() {
    const data = {
        transactions: state.transactions,
        categories: state.categories,
        settings: state.settings,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `dompin-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Data berhasil diekspor! 💾');
    console.log('Data exported');
}

/**
 * Handle import data
 */
function handleImportData() {
    const fileInput = document.getElementById('importFileInput');
    
    if (!fileInput) return;
    
    fileInput.click();
}

/**
 * Process imported file
 * @param {Event} e - File input change event
 */
function processImportedFile(e) {
    const file = e.target.files[0];
    
    if (!file) return;
    
    const reader = new FileReader();
    
    reader.onload = function(event) {
        try {
            const data = JSON.parse(event.target.result);
            
            // Validate data structure
            if (!data.transactions || !data.categories || !data.settings) {
                throw new Error('Invalid data format');
            }
            
            // Confirm import
            const confirmImport = confirm(
                `Import data dengan ${data.transactions.length} transaksi dan ${data.categories.length} kategori?\n\nPeringatan: Data saat ini akan diganti!`
            );
            
            if (!confirmImport) {
                return;
            }
            
            // Import data
            state.transactions = data.transactions;
            state.categories = data.categories;
            state.settings = data.settings;
            
            // Save to localStorage
            saveData();
            
            // Reload theme
            loadTheme();
            
            // Re-render current page
            renderCurrentPage();
            
            showNotification('Data berhasil diimpor! ✅');
            console.log('Data imported successfully');
            
        } catch (error) {
            alert('Gagal mengimpor data. File tidak valid.');
            console.error('Import error:', error);
        }
    };
    
    reader.readAsText(file);
}

/**
 * Handle clear all data
 */
function handleClearAllData() {
    const confirmClear = confirm(
        'PERINGATAN: Semua data akan dihapus!\n\nTransaksi, kategori custom, dan pengaturan akan hilang permanen.\n\nLanjutkan?'
    );
    
    if (!confirmClear) {
        return;
    }
    
    const doubleConfirm = confirm('Apakah Anda BENAR-BENAR yakin? Ini tidak dapat dibatalkan!');
    
    if (!doubleConfirm) {
        return;
    }
    
    // Clear storage
    Storage.clear();
    
    // Reload page
    showNotification('Semua data berhasil dihapus! 🔄');
    
    setTimeout(() => {
        location.reload();
    }, 1500);
}

// ========================================
// 8. EVENT HANDLERS
// ========================================

/**
 * Handle add transaction form submission
 * @param {Event} e - Form submit event
 */
function handleAddTransaction(e) {
    e.preventDefault();
    
    // Get form values
    const nameInput = document.getElementById('itemName');
    const amountInput = document.getElementById('itemAmount');
    const categorySelect = document.getElementById('itemCategory');
    
    const name = nameInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const categoryId = categorySelect.value;
    
    // Validate inputs
    const validation = validateTransaction(name, amount, categoryId);
    
    if (!validation.valid) {
        alert(validation.error);
        return;
    }
    
    // Get category info
    const category = getCategoryById(categoryId);
    if (!category) {
        alert('Kategori tidak ditemukan');
        return;
    }
    
    // Create transaction object
    const transaction = {
        id: generateId(),
        name: name,
        amount: amount,
        category: categoryId,
        date: new Date().toISOString(),
        emoji: category.emoji
    };
    
    // Add to state and save
    addTransaction(transaction);
    
    // Clear form
    nameInput.value = '';
    amountInput.value = '';
    categorySelect.value = '';
    
    // Show success feedback
    showNotification('Transaksi berhasil ditambahkan! ✅');
    
    // Re-render home page
    renderHomePage();
    
    console.log('Transaction added successfully:', transaction);
}

/**
 * Handle delete transaction
 * @param {string} transactionId - Transaction ID to delete
 */
function handleDeleteTransaction(transactionId) {
    // Find transaction
    const transaction = state.transactions.find(t => t.id === transactionId);
    
    if (!transaction) {
        alert('Transaksi tidak ditemukan');
        return;
    }
    
    // Confirm deletion
    const confirmDelete = confirm(
        `Yakin ingin menghapus transaksi "${transaction.name}" (${formatRupiah(transaction.amount)})?`
    );
    
    if (!confirmDelete) {
        return;
    }
    
    // Delete transaction
    deleteTransaction(transactionId);
    
    // Show success feedback
    showNotification('Transaksi berhasil dihapus! 🗑️');
    
    // Re-render home page
    renderHomePage();
    
    console.log('Transaction deleted successfully:', transactionId);
}

/**
 * Handle sort change
 * @param {Event} e - Change event
 */
function handleSortChange(e) {
    console.log('Sort changed to:', e.target.value);
    // Just re-render the list, it will use the new sort value
    renderTransactionList();
}

/**
 * Handle period change
 * @param {Event} e - Change event
 */
function handlePeriodChange(e) {
    const newPeriod = e.target.value;
    console.log('Period changed to:', newPeriod);
    
    // Update state
    state.currentPeriod = newPeriod;
    state.settings.currentPeriod = newPeriod;
    
    // Save settings
    updateSettings({ currentPeriod: newPeriod });
    
    // Re-render home page
    renderHomePage();
}

/**
 * Show temporary notification
 * @param {string} message - Message to show
 */
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        background-color: var(--success-color);
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        animation: slideDown 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

/**
 * Setup form event listeners
 */
function setupFormListeners() {
    // Transaction form
    const transactionForm = document.getElementById('transactionForm');
    if (transactionForm) {
        transactionForm.addEventListener('submit', handleAddTransaction);
        console.log('Transaction form listener attached');
    }
    
    // Delete buttons (event delegation on parent)
    const transactionList = document.getElementById('transactionList');
    if (transactionList) {
        transactionList.addEventListener('click', (e) => {
            // Check if clicked element is delete button or its child
            const deleteBtn = e.target.closest('.delete-btn');
            if (deleteBtn) {
                const transactionId = deleteBtn.dataset.id;
                if (transactionId) {
                    handleDeleteTransaction(transactionId);
                }
            }
        });
        console.log('Delete button listener attached (event delegation)');
    }
    
    // Sort dropdown
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', handleSortChange);
        console.log('Sort dropdown listener attached');
    }
    
    // Period dropdown
    const periodSelect = document.getElementById('periodSelect');
    if (periodSelect) {
        periodSelect.addEventListener('change', handlePeriodChange);
        console.log('Period dropdown listener attached');
    }
    
    // Theme toggle buttons
    const themeToggleHeader = document.getElementById('themeToggle');
    const themeSwitch = document.getElementById('themeSwitch');
    
    if (themeToggleHeader) {
        themeToggleHeader.addEventListener('click', toggleTheme);
        console.log('Header theme toggle listener attached');
    }
    
    if (themeSwitch) {
        themeSwitch.addEventListener('change', toggleTheme);
        console.log('Settings theme switch listener attached');
    }
    
    // Budgets page
    const saveBudgetBtn = document.getElementById('saveBudgetBtn');
    if (saveBudgetBtn) {
        saveBudgetBtn.addEventListener('click', () => {
            handleSaveMonthlyBudget();
            handleSaveCategoryBudgets();
        });
        console.log('Save budget button listener attached');
    }
    
    // Settings page
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', openCategoryModal);
        console.log('Add category button listener attached');
    }
    
    // Category modal buttons
    const confirmCategoryBtn = document.getElementById('confirmCategoryBtn');
    if (confirmCategoryBtn) {
        confirmCategoryBtn.addEventListener('click', confirmAddCategory);
    }

    const cancelCategoryBtn = document.getElementById('cancelCategoryBtn');
    if (cancelCategoryBtn) {
        cancelCategoryBtn.addEventListener('click', closeCategoryModal);
    }

    const categoryManagementList = document.getElementById('categoryManagementList');
    if (categoryManagementList) {
        categoryManagementList.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.delete-category-btn');
            if (deleteBtn) {
                const categoryId = deleteBtn.dataset.categoryId;
                if (categoryId) {
                    handleDeleteCategory(categoryId);
                }
            }
        });
        console.log('Category delete listener attached (event delegation)');
    }
    
    const exportDataBtn = document.getElementById('exportDataBtn');
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', handleExportData);
        console.log('Export data button listener attached');
    }
    
    const importDataBtn = document.getElementById('importDataBtn');
    if (importDataBtn) {
        importDataBtn.addEventListener('click', handleImportData);
        console.log('Import data button listener attached');
    }
    
    const importFileInput = document.getElementById('importFileInput');
    if (importFileInput) {
        importFileInput.addEventListener('change', processImportedFile);
        console.log('Import file input listener attached');
    }
    
    const clearDataBtn = document.getElementById('clearDataBtn');
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', handleClearAllData);
        console.log('Clear data button listener attached');
    }
}

/**
 * Toggle between light and dark theme
 */
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    // Update DOM
    html.setAttribute('data-theme', newTheme);
    
    // Update theme toggle button icon
    const themeToggleIcon = document.querySelector('#themeToggle .material-icons');
    if (themeToggleIcon) {
        themeToggleIcon.textContent = newTheme === 'dark' ? 'light_mode' : 'dark_mode';
    }
    
    // Update theme switch in settings
    const themeSwitch = document.getElementById('themeSwitch');
    if (themeSwitch) {
        themeSwitch.checked = (newTheme === 'dark');
    }
    
    // Save to settings
    updateSettings({ theme: newTheme });
    
    // Re-render charts to update colors
    if (state.currentPage === 'home') {
        renderPieChart();
    }
    
    console.log('Theme switched to:', newTheme);
}

/**
 * Load and apply saved theme
 */
function loadTheme() {
    const savedTheme = state.settings.theme || 'light';
    const html = document.documentElement;
    
    html.setAttribute('data-theme', savedTheme);
    
    // Update theme toggle button icon
    const themeToggleIcon = document.querySelector('#themeToggle .material-icons');
    if (themeToggleIcon) {
        themeToggleIcon.textContent = savedTheme === 'dark' ? 'light_mode' : 'dark_mode';
    }
    
    // Update theme switch in settings
    const themeSwitch = document.getElementById('themeSwitch');
    if (themeSwitch) {
        themeSwitch.checked = (savedTheme === 'dark');
    }
    
    console.log('Theme loaded:', savedTheme);
}

/**
 * Setup navigation event listeners
 */
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    
    navButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const pageName = button.getAttribute('data-page');
            if (pageName) {
                navigateTo(pageName);
            }
        });
    });
    
    console.log('Navigation system initialized');
}

// ========================================
// 9. INITIALIZATION
// ========================================

/**
 * Initialize the application
 */
function init() {
    console.log('Initializing DomPin...');
    
    // Load data from localStorage
    loadData();
    
    // Load and apply theme
    loadTheme();
    
    // Setup navigation
    setupNavigation();
    
    // Setup form listeners
    setupFormListeners();
    
    // Set initial page
    navigateTo('home');
    
    console.log('DomPin initialized successfully! 🚀');
    console.log('Current state:', state);
}

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', init);
