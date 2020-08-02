<template>
  <div>
    <b-card-group columns>
      <b-card
        v-for="(item, index) in list"
        :key="index"
        :title="item.first_name"
        :img-src="item.avatar"
        img-top
      >
        <b-card-text>
          E-mail: {{ item.email }}
        </b-card-text>
      </b-card>
    </b-card-group>
    
    <b-button
      :disabled="this.pagination.page === this.pagination.lastPage"
      @click="goToNextPage"
    >
      Load more...
    </b-button>
  </div>
</template>

<script>
import GenList from './GenList.js';

export default {
  name: 'BoostrapMasonry',
  extends: GenList,  
  
  created() {
    this.infinite = true;
  },
}
</script>