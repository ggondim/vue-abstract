<template>
  <div>
    <b-table striped hover :items="list"></b-table>
    
    <b-pagination
      v-model="currentPage"
      :total-rows="pagination.count"
      :per-page="pagination.limit"
    ></b-pagination>
  </div>
</template>

<script>
import GenList from './GenList.js';

export default {
  name: 'BoostrapTable',
  extends: GenList,  

  data: () => ({
    currentPage: 0,
  }),

  watch: {
    async currentPage(newPage, oldPage) {
      if (!newPage || !oldPage) return;
      this.pagination.rebuild({
        page: newPage
      });
      await this.updatePage();
    }
  },
  
  created() {
    this.currentPage = this.pagination.page;
  },
}
</script>