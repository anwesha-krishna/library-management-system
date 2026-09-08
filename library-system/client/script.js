const API_BASE = 'https://library-management-system-8s6h.onrender.com/api';

function showMessage(text, isError) {
  const el = document.getElementById('message');
  if (!el) return;
  el.textContent = text;
  el.style.color = isError ? 'var(--accent-rose)' : 'var(--accent-sage)';
}

// --- Render Books Table + Stat Metrics ---
function renderBooks(books) {
  let totalCopies = 0;
  let availableCopies = 0;

  books.forEach((book) => {
    totalCopies += Number(book.totalCopies || 0);
    availableCopies += Number(book.availableCopies || 0);
  });

  const issuedCopies = totalCopies - availableCopies;

  const elTotal = document.getElementById('stat-total');
  const elAvailable = document.getElementById('stat-available');
  const elIssued = document.getElementById('stat-issued');

  if (elTotal) elTotal.textContent = totalCopies;
  if (elAvailable) elAvailable.textContent = availableCopies;
  if (elIssued) elIssued.textContent = issuedCopies;

  const tbody = document.getElementById('books-table-body');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (!books.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-muted);">No books found.</td></tr>';
    return;
  }

  books.forEach((book) => {
    const tr = document.createElement('tr');
    const statusClass = book.status === 'Available' ? 'available' : 'issued';

    tr.innerHTML = `
      <td><img class="qr-thumb" src="${book.qrCodeDataUrl}" alt="QR for ${book.bookId}" /></td>
      <td>${book.title}</td>
      <td>${book.author}</td>
      <td>${book.category || '-'}</td>
      <td>${book.availableCopies}/${book.totalCopies}</td>
      <td><span class="badge ${statusClass}">${book.status}</span></td>
      <td><button class="danger" data-id="${book._id}">Delete</button></td>
    `;

    tr.querySelector('button.danger').addEventListener('click', () => deleteBook(book._id));
    tbody.appendChild(tr);
  });
}

// --- Render Transactions & Borrower Details ---
function renderTransactions(transactions) {
  const tbody = document.getElementById('transactions-table-body');
  const elOverdue = document.getElementById('stat-overdue');
  if (!tbody) return;

  tbody.innerHTML = '';
  let overdueCount = 0;

  if (!transactions.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">No transaction records found.</td></tr>';
    if (elOverdue) elOverdue.textContent = 0;
    return;
  }

  transactions.forEach((t) => {
    if (t.isOverdue) overdueCount++;

    const tr = document.createElement('tr');
    const issueStr = t.issueDate ? new Date(t.issueDate).toLocaleDateString() : '-';
    const returnStr = t.returnDate ? new Date(t.returnDate).toLocaleDateString() : 'Active';

    let statusBadge = '<span class="badge available">Returned</span>';
    if (!t.returnDate) {
      statusBadge = t.isOverdue 
        ? `<span class="badge" style="background:#f3dcd8; color:var(--accent-rose);">${t.overdueDays} Days Overdue</span>`
        : '<span class="badge issued">Issued</span>';
    }

    tr.innerHTML = `
      <td>${t.bookTitle}</td>
      <td><code>${t.bookId}</code></td>
      <td>${t.borrowerName}</td>
      <td>${issueStr}</td>
      <td>${returnStr}</td>
      <td>${statusBadge}</td>
    `;
    tbody.appendChild(tr);
  });

  if (elOverdue) elOverdue.textContent = overdueCount;
}

// --- Fetch Transactions ---
async function loadTransactions() {
  try {
    const res = await fetch(`${API_BASE}/transactions`);
    const transactions = await res.json();
    if (res.ok) renderTransactions(transactions);
  } catch (err) {
    console.error('Failed to load transactions:', err);
  }
}

// --- Clear Returned History ---
async function handleClearHistory() {
  if (!confirm('Clear all returned transaction records? (Active issued books will remain)')) return;

  try {
    const res = await fetch(`${API_BASE}/transactions/clear`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to clear history.');
    loadTransactions();
  } catch (err) {
    console.error('Failed to clear history:', err);
  }
}

// --- Fetch + Filter Books ---
async function loadBooks(filters = {}) {
  try {
    const params = new URLSearchParams(filters);
    const res = await fetch(`${API_BASE}/books?${params.toString()}`);
    const books = await res.json();
    if (!res.ok) throw new Error(books.error || 'Failed to load books.');
    renderBooks(books);
  } catch (err) {
    showMessage(err.message, true);
  }
}

// --- Add Book Handler ---
async function handleAddBook(e) {
  e.preventDefault();

  const payload = {
    title: document.getElementById('title').value.trim(),
    author: document.getElementById('author').value.trim(),
    isbn: document.getElementById('isbn').value.trim(),
    category: document.getElementById('category').value.trim(),
    totalCopies: document.getElementById('totalCopies').value || 1,
  };

  try {
    const res = await fetch(`${API_BASE}/books`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add book.');

    showMessage(`Added "${data.title}" (ID: ${data.bookId}).`, false);
    document.getElementById('add-book-form').reset();
    loadBooks();
  } catch (err) {
    showMessage(err.message, true);
  }
}

// --- Delete Book Handler ---
async function deleteBook(id) {
  if (!confirm('Delete this book and its record?')) return;
  try {
    const res = await fetch(`${API_BASE}/books/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete book.');
    loadBooks();
  } catch (err) {
    showMessage(err.message, true);
  }
}

// --- Search Filter Handler ---
function handleSearch() {
  const filters = {
    title: document.getElementById('filter-title').value.trim(),
    author: document.getElementById('filter-author').value.trim(),
    category: document.getElementById('filter-category').value.trim(),
    status: document.getElementById('filter-status').value,
  };
  Object.keys(filters).forEach((k) => !filters[k] && delete filters[k]);
  loadBooks(filters);
}

// --- AI Chat Assistant Handler ---
function initAiAssistant() {
  const toggle = document.getElementById('ai-widget-toggle');
  const box = document.getElementById('ai-chat-box');
  const close = document.getElementById('ai-close');
  const sendBtn = document.getElementById('ai-send-btn');
  const input = document.getElementById('ai-input');
  const messagesContainer = document.getElementById('ai-messages');

  if (!toggle || !box) return;

  toggle.addEventListener('click', () => box.style.display = 'flex');
  close.addEventListener('click', () => box.style.display = 'none');

  async function sendAiMessage() {
    const text = input.value.trim();
    if (!text) return;

    // Append User Message
    const userMsg = document.createElement('div');
    userMsg.className = 'ai-msg user';
    userMsg.textContent = text;
    messagesContainer.appendChild(userMsg);
    input.value = '';
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Loading State
    const botMsg = document.createElement('div');
    botMsg.className = 'ai-msg bot';
    botMsg.textContent = 'Thinking...';
    messagesContainer.appendChild(botMsg);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    try {
      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text }),
      });
      const data = await res.json();
      botMsg.textContent = data.reply || data.error || 'Sorry, I could not process that request.';
    } catch (err) {
      botMsg.textContent = 'Error communicating with AI assistant.';
    }
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  sendBtn.addEventListener('click', sendAiMessage);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendAiMessage();
  });
}

// Initialize Dashboard
const addBookForm = document.getElementById('add-book-form');
if (addBookForm) {
  addBookForm.addEventListener('submit', handleAddBook);
  document.getElementById('search-btn').addEventListener('click', handleSearch);
  
  const clearHistoryBtn = document.getElementById('clear-history-btn');
  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', handleClearHistory);
  }

  loadBooks();
  loadTransactions();
  initAiAssistant();
}

// --- Floating Animated Canvas Background ---
(function initFloatingBooks() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const colors = ['#d97736', '#e6a13b', '#a66e4e', '#5a8a6e', '#c85a5a'];

  function drawClosedBook(ctx, size) {
    ctx.beginPath();
    ctx.roundRect(-size / 2, -size / 1.4, size, size * 1.3, 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-size / 2 + size * 0.2, -size / 1.4);
    ctx.lineTo(-size / 2 + size * 0.2, size * 0.6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-size * 0.1, size * 0.6);
    ctx.lineTo(-size * 0.1, size * 0.95);
    ctx.lineTo(0, size * 0.82);
    ctx.lineTo(size * 0.1, size * 0.95);
    ctx.lineTo(size * 0.1, size * 0.6);
    ctx.fill();
  }

  function drawOpenBook(ctx, size) {
    const w = size * 0.7;
    const h = size * 0.8;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(w / 2, -h * 0.15, w, -h * 0.05);
    ctx.lineTo(w, h * 0.8);
    ctx.quadraticCurveTo(w / 2, h * 0.7, 0, h * 0.85);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-w / 2, -h * 0.15, -w, -h * 0.05);
    ctx.lineTo(-w, h * 0.8);
    ctx.quadraticCurveTo(-w / 2, h * 0.7, 0, h * 0.85);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-w * 0.4, -h * 0.35, -w * 0.8, -h * 0.25);
    ctx.lineTo(-w * 0.75, h * 0.55);
    ctx.stroke();
  }

  function drawAngledOpenBook(ctx, size) {
    const w = size * 0.75;
    const h = size * 0.85;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.3);
    ctx.lineTo(-w, -h * 0.3);
    ctx.lineTo(-w, h * 0.4);
    ctx.lineTo(0, h * 0.9);
    ctx.lineTo(w, h * 0.4);
    ctx.lineTo(w, -h * 0.3);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, h * 0.3);
    ctx.lineTo(0, h * 0.9);
    ctx.stroke();
  }

  const bookDrawers = [drawClosedBook, drawOpenBook, drawAngledOpenBook];

  class BookParticle {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = Math.random() * width;
      this.y = initial ? Math.random() * height : height + 40;
      this.size = Math.random() * 18 + 16;
      this.vx = (Math.random() - 0.5) * 1.8;
      this.vy = -(Math.random() * 1.8 + 0.8);
      this.rotation = Math.random() * Math.PI * 2;
      this.vRot = (Math.random() - 0.5) * 0.03;
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.drawer = bookDrawers[Math.floor(Math.random() * bookDrawers.length)];
      this.opacity = Math.random() * 0.35 + 0.2;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.rotation += this.vRot;

      if (this.y < -50 || this.x < -50 || this.x > width + 50) {
        this.reset(false);
      }
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.strokeStyle = this.color;
      ctx.fillStyle = this.color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = this.opacity;

      this.drawer(ctx, this.size);
      ctx.restore();
    }
  }

  const books = Array.from({ length: 30 }, () => new BookParticle());

  function animate() {
    ctx.clearRect(0, 0, width, height);
    books.forEach((book) => {
      book.update();
      book.draw();
    });
    requestAnimationFrame(animate);
  }

  animate();
})();