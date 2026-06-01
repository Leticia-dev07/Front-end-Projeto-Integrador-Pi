/**
 * components/table/table.js
 * Reusable data table with search, sort, pagination, and actions.
 */
const Table = {
  /**
   * @param {string} containerId - ID of the container element
   * @param {Object} config - { columns, data, actions, pageSize, searchable, onRowClick }
   */
  render(containerId, config) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let { columns, data, actions = [], pageSize = 10, searchable = true, emptyMsg = 'Nenhum registro encontrado.', toolbar = '' } = config;
    let currentData = [...data];
    let filtered    = [...data];
    let sortKey     = null;
    let sortDir     = 'asc';
    let page        = 1;
    let searchVal   = '';

    const totalPages = () => Math.max(1, Math.ceil(filtered.length / pageSize));
    const paginated  = () => filtered.slice((page - 1) * pageSize, page * pageSize);

    const applyFilter = () => {
      if (!searchVal.trim()) { filtered = [...currentData]; return; }
      const q = searchVal.toLowerCase();
      filtered = currentData.filter(row =>
        columns.some(col => String(col.value ? col.value(row) : (row[col.key] ?? '')).toLowerCase().includes(q))
      );
      page = 1;
    };

    const applySort = (key) => {
      if (sortKey === key) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
      else { sortKey = key; sortDir = 'asc'; }
      filtered = Helpers.sortBy(filtered, key, sortDir);
      page = 1;
    };

    const renderHead = () => columns.map(col => {
      const isSorted = sortKey === col.key;
      return `<th class="${isSorted ? 'sorted' : ''}" data-key="${col.key || ''}" style="${col.width ? 'width:' + col.width : ''}">
        ${col.label}
        ${col.sortable !== false && col.key ? `<i class="sort-icon fas fa-${isSorted ? (sortDir === 'asc' ? 'sort-up' : 'sort-down') : 'sort'} sort-icon"></i>` : ''}
      </th>`;
    }).join('') + (actions.length ? '<th style="width:120px">Ações</th>' : '');

    const renderRows = () => {
      const rows = paginated();
      if (!rows.length) return `<tr><td colspan="${columns.length + (actions.length ? 1 : 0)}">
        <div class="empty-state"><i class="fas fa-inbox empty-icon"></i><h3>${emptyMsg}</h3></div>
      </td></tr>`;
      return rows.map(row => {
        const cells = columns.map(col => {
          const val = col.render ? col.render(row) : Helpers.escHtml(String(col.value ? col.value(row) : (row[col.key] ?? '—')));
          return `<td>${val}</td>`;
        }).join('');
        const acts = actions.length ? `<td><div class="actions">${
          actions.map(act => {
            if (act.hidden && act.hidden(row)) return '';
            return `<button class="btn btn-icon btn-sm btn-${act.type || 'ghost'}" title="${act.label}" data-action="${act.key}" data-id="${row.id}">
              <i class="${act.icon}"></i>
            </button>`;
          }).join('')
        }</div></td>` : '';
        return `<tr data-id="${row.id}">${cells}${acts}</tr>`;
      }).join('');
    };

    const renderPagination = () => {
      const tp = totalPages();
      const start = Math.min((page - 1) * pageSize + 1, filtered.length);
      const end   = Math.min(page * pageSize, filtered.length);
      const pages = [];
      for (let i = Math.max(1, page - 2); i <= Math.min(tp, page + 2); i++) pages.push(i);
      return `
        <span>${filtered.length > 0 ? `${start}–${end} de ${filtered.length}` : '0 resultados'}</span>
        <div class="pagination-buttons">
          <button class="page-btn" data-pg="prev" ${page === 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>
          ${pages.map(p => `<button class="page-btn ${p === page ? 'active' : ''}" data-pg="${p}">${p}</button>`).join('')}
          <button class="page-btn" data-pg="next" ${page === tp ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>
        </div>`;
    };

    const draw = () => {
      const tableEl = container.querySelector('tbody');
      const paginEl = container.querySelector('.table-pagination');
      const headEl  = container.querySelector('thead tr');
      if (tableEl)  tableEl.innerHTML = renderRows();
      if (paginEl)  paginEl.innerHTML = renderPagination();
      if (headEl)   headEl.innerHTML  = renderHead();
      bindEvents();
    };

    const init = () => {
      container.innerHTML = `
        <div class="table-toolbar">
          ${searchable ? `
            <div class="table-search">
              <i class="fas fa-magnifying-glass search-icon"></i>
              <input type="text" placeholder="Buscar..." id="${containerId}-search" value="${Helpers.escHtml(searchVal)}">
            </div>` : '<div></div>'}
          <div class="table-actions">${toolbar}</div>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead><tr>${renderHead()}</tr></thead>
            <tbody>${renderRows()}</tbody>
          </table>
        </div>
        <div class="table-pagination">${renderPagination()}</div>
      `;
      bindEvents();
    };

    const bindEvents = () => {
      // Search
      const searchInput = document.getElementById(`${containerId}-search`);
      if (searchInput) {
        searchInput.oninput = Helpers.debounce((e) => {
          searchVal = e.target.value;
          applyFilter();
          draw();
        });
      }

      // Sort
      container.querySelectorAll('thead th[data-key]').forEach(th => {
        if (!th.dataset.key) return;
        th.onclick = () => { applySort(th.dataset.key); draw(); };
      });

      // Pagination
      container.querySelectorAll('.page-btn').forEach(btn => {
        btn.onclick = () => {
          const pg = btn.dataset.pg;
          if (pg === 'prev') page = Math.max(1, page - 1);
          else if (pg === 'next') page = Math.min(totalPages(), page + 1);
          else page = Number(pg);
          draw();
        };
      });

      // Actions
      container.querySelectorAll('[data-action]').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const action = actions.find(a => a.key === btn.dataset.action);
          const row = currentData.find(r => String(r.id) === btn.dataset.id);
          if (action && row) action.onClick(row, () => {
            applyFilter();
            draw();
          });
        };
      });
    };

    // Public API
    this._instances = this._instances || {};
    this._instances[containerId] = {
      reload(newData) {
        currentData = [...newData];
        filtered = [...newData];
        applyFilter();
        draw();
      },
    };

    init();
  },

  reload(containerId, newData) {
    this._instances?.[containerId]?.reload(newData);
  },
};

window.Table = Table;
