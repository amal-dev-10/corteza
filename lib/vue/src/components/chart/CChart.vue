<template>
  <e-charts
    ref="chart"
    :option="chart"
    :theme="theme"
    autoresize
    class="position-absolute w-100 h-100 overflow-hidden"
    v-on="$listeners"
  />
</template>

<script>
import { shared } from '@cortezaproject/corteza-js'

export default {
  props: {
    chart: {
      type: shared.Chart,
      required: true,
    },
  },

  computed: {
    theme () {
      const { darkMode } = this.chart || {}
      return darkMode ? 'dark' : 'light'
    },
  },

  beforeUnmount () {
    if (this.$refs.chart) {
      this.$refs.chart.dispose()
    }
  },
}
</script>
