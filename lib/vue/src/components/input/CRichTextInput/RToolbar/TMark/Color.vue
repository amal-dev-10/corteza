<template>
  <div>
    <b-button
      :id="`color-popover-${format.type}`"
      variant="link"
      class="text-dark font-weight-bold text-decoration-none"
    >
      <span
        class="icon"
        :class="typeStyle"
      >A</span>
    </b-button>

    <b-popover
      ref="popover"
      :delay="0"
      no-fade
      custom-class="tcl-popover"
      triggers="focus"
      :target="`color-popover-${format.type}`"
      placement="bottom"
      :container="null"
    >
      <swatches
        swatch-size="14"
        colors="text-advanced"
        inline
        @input="onClick(format.type, { color: $event })"
      />
    </b-popover>
  </div>
</template>

<script>
import base from './base.vue'
import Swatches from 'vue-swatches'
import 'vue-swatches/dist/vue-swatches.css'

/**
 * Component is used to display link formatters. It provides an interface to
 * input the URL that should be applied.
 */
export default {
  name: 'TMarkColor',

  components: {
    Swatches,
  },
  extends: base,

  computed: {
    typeStyle () {
      return `${this.format.type}-icon`
    },
  },
}

</script>

<style lang="scss" scoped>
// Since we don't have icons for color related formatters,
// this extra styling makes up for that
.icon {
  padding: 0 2px;

  &.color-icon {
    border-bottom: 1px solid black;
  }

  &.background-icon {
    background-color: rgba(black, 0.07);
    padding: 2px 3px;
  }
}
</style>

<style lang="scss">
// Bootstrap popover doesn't provide a way to style it's body component
// Can't be scoped, since it's not rendered in here
.tcl-popover .popover-body {
  padding: 0 !important;
}
</style>
