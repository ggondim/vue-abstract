class Pagination {
  constructor({
    limit,
    offset,
    page,
    count,
    firstPage = 0,
  }) {
    this.limit = limit;
    this.offset = offset
    this.count = count;
    this.firstPage = firstPage;

    this.page = !page && !offset ? firstPage : page;

    this.rebuild({
      page,
      offset,
    });
  }

  rebuild({ page, offset }) {
    this.limit = parseInt(this.limit);

    if (offset) {
      this.offset = parseInt(offset);
      this.page = Math.floor(offset / this.limit) + this.firstPage;
    } else if (page) {
      this.page = parseInt(page);
      this.offset = (page - this.firstPage) * this.limit;
    }

    if (this.count) {
      this.count = parseInt(this.count);
      this.pages = Math.ceil(this.count / this.limit);
      this.lastPage = this.pages - 1 + this.firstPage;
      this.previousPage = this.page > this.firstPage ? this.page - 1 : this.firstPage;
      this.nextPage = this.page < this.lastPage ? this.page + 1 : this.lastPage;
      this.lastOffset = (this.pages - 1 - this.firstPage) * this.limit;
      this.previousOffset = this.offset > this.limit ? this.offset - this.limit : 0;
      this.nextOffset = this.offset < this.lastOffset ? this.offset + this.limit : this.lastOffset;
    }
  }
}

function paginationToHttpQuery(pagination, {
  preferOffset = false,
  paginationParams,
} = {}) {
  const params = new URLSearchParams();
  params.append(paginationParams.limit, pagination.limit);

  if (preferOffset) params.append(paginationParams.offset, pagination.offset);
  else params.append(paginationParams.page, pagination.page);

  return params.toString();
}

const RESULT_FN = (responseJson) => responseJson;
const COUNT_FN = (responseJson) => responseJson.count;
const PAGINATION_QUERY_PARAMS = {
  limit: 'limit',
  offset: 'offset',
  page: 'page',
};

export default {

  props: {
    prefetch: { type: Boolean, default: true },
    pagination: { type: Object, required: true },
    fetchUrl: { type: String, required: true },
    countUrl: { type: String, required: true },
    preferOffset: { type: Boolean, default: false },
    cachePages: { type: Boolean, default: true },
    infinite: { type: Boolean, default: false },
    resultExpression: { type: Function, default: RESULT_FN },
    countExpression: { type: Function, default: COUNT_FN },
    paginationQueryParams: { type: Object, default: PAGINATION_QUERY_PARAMS },
  },

  data: () => ({
    list: [],
    listCache: {},
    loading: false,
  }),

  watch: {
    async fetchUrl(newUrl) {
      await this.initialize();
    },
  },

  async created() {
    if (!(this.pagination instanceof Pagination)) {
      this.pagination = new Pagination(this.pagination);
    }
    await this.initialize();
  },

  methods: {
    async initialize() {
      if (!this.pagination.page) {
        this.pagination.rebuild({
          page: this.pagination.firstPage
        });
      }
      await this.updateTotalCount();
      await this.updatePage();
    },

    async updateTotalCount() {
      const query = paginationToHttpQuery(this.pagination, {
        preferOffset: this.preferOffset,
        paginationParams: this.paginationQueryParams,
      });

      const response = await fetch(`${this.countUrl}?${query}`);
      const body = await response.json();
      const count = this.countExpression(body);

      this.pagination.count = count;
      this.pagination.rebuild({
        page: this.pagination.page
      });
    },

    async fetchPage(pagination) {
      if (this.isPageCached(pagination.page)) return this.listCache[pagination.page];

      const query = paginationToHttpQuery(pagination, {
        preferOffset: this.preferOffset,
        paginationParams: this.paginationQueryParams,
      });
      const response = await fetch(`${this.fetchUrl}?${query}`);
      const body = await response.json();
      const results = this.resultExpression(body);

      this.cachePage(pagination.page, results);
      return results;
    },

    async updatePage() {
      const results = await this.fetchPage(this.pagination); 

      if (this.infinite) {
        this.list = [...this.list, ...results];
      } else {
        this.list = results;
      }

      if (this.prefetch && this.pagination.page !== this.pagination.lastPage) {
        const nextPagination = new Pagination(this.pagination);
        nextPagination.page = this.pagination.nextPage; 
        await this.fetchPage(nextPagination);
      }
    },

    isPageCached(page) {
      return this.listCache[page] && this.listCache[page].length;
    },

    cachePage(page, results) {
      this.listCache[page] = results;
    },

    async goToNextPage() {
      this.pagination.rebuild({
        page: this.pagination.nextPage
      });
      await this.updatePage();
    },

    async goToPreviousPage() {
      this.pagination.rebuild({
        page: this.pagination.previousPage
      });
      await this.updatePage();
    },

    async goToFirstPage() {
      this.pagination.rebuild({
        page: this.pagination.firstPage
      });
      await this.updatePage();
    },

    async goToLastPage() {
      this.pagination.rebuild({
        page: this.pagination.lastPage
      });
      await this.updatePage();
    },

    async goToPage(pageNumber) {
      this.pagination.rebuild({
        page: pageNumber
      });
      await this.updatePage();
    },
  },
}