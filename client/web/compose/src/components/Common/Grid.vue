<template>
  <div
    v-if="layout.length"
    class="w-100"
    :class="{
      'editable': editable,
      'flex-grow-1 d-flex': isStretchable,
    }"
  >
    <grid-layout
      :layout.sync="layout"
      :col-num="48"
      :row-height="10"
      vertical-compact
      :is-resizable="editable"
      :is-draggable="editable"
      :cols="columnNumber"
      :margin="[0, 0]"
      :responsive="!editable"
      :use-css-transforms="false"
      class="flex-grow-1 d-flex w-100 h-100"
      @layout-updated="onLayoutUpdated"
    >
      <template
        v-for="(item, index) in layout"
      >
        <grid-item
          v-if="blocks[item.i] && !blocks[item.i].meta.hidden"
          :key="item.i"
          ref="items"
          :i="item.i"
          :h="item.h"
          :w="item.w"
          :x="item.x"
          :y="item.y"
          :min-w="6"
          :min-h="5"
          :class="{ 'h-100': isStretchable }"
          class="grid-item"
          style="touch-action: none;"
          @move="onGridAction"
          @resize="onGridAction"
        >
          <slot
            v-if="!blocks[item.i].meta.invisible"
            :block="blocks[item.i]"
            :index="index"
            :block-index="item.i"
            :resizing="resizing"
            :loading-record="loadingRecord"
            v-on="$listeners"
          />
        </grid-item>
      </template>
    </grid-layout>
  </div>

  <div
    v-else
    class="no-builder-grid h-100 pt-5 container text-center"
  >
    <h4>
      {{ $t('noBlock') }}
    </h4>
  </div>
</template>

<script>
import { GridLayout, GridItem } from 'vue-grid-layout'

export default {
  i18nOptions: {
    namespaces: 'page',
  },

  components: {
    GridLayout,
    GridItem,
  },

  props: {
    blocks: {
      type: Array,
      default: () => ([]),
    },

    editable: {
      type: Boolean,
    },

    loadingRecord: {
      type: Boolean,
      default: false,
    },
  },

  data () {
    return {
      // all blocks in vue-grid friendly structure
      layout: [],

      resizing: false,
    }
  },

  computed: {
    oneBlockLayout () {
      return this.blocks.filter(({ meta }) => !meta.hidden).length === 1
    },

    isStretchable () {
      return !this.editable && this.oneBlockLayout
    },

    columnNumber () {
      if (this.oneBlockLayout) {
        return { lg: 1, md: 1, sm: 1, xs: 1, xxs: 1 }
      }
      return { lg: 48, md: 48, sm: 1, xs: 1, xxs: 1 }
    },
  },

  watch: {
    blocks: {
      immediate: true,
      deep: true,
      handler (blocks) {
        blocks = blocks.map(({ meta, xywh: [x, y, w, h] }, i) => {
          // To avoid collision with hidden elements
          return meta.hidden ? { i, x: 0, y: 0, w: 0, h: 0 } : { i, x, y, w, h }
        })

        this.$nextTick(() => {
          this.$set(this, 'layout', blocks)
          this.forceRerender()
        })
      },
    },
  },

  beforeDestroy () {
    this.setDefaultValues()
  },

  methods: {
    onLayoutUpdated () {
      if (!this.editable) return

      this.resizing = false

      this.blocks.forEach(({ xywh = [] }, idx) => {
        const { x, y, w, h } = this.layout[idx]
        const layoutXYWH = [x, y, w, h]

        if (xywh.toString() === layoutXYWH.toString()) return

        this.$emit('item-updated', idx)
        this.blocks[idx].xywh = layoutXYWH
      })
    },

    onGridAction () {
      if (!this.resizing) {
        this.resizing = true
      }
    },

    setDefaultValues () {
      this.layout = []
      this.resizing = false
    },

    forceRerender () {
      // Force the grid layout to recalculate its dimensions
      window.dispatchEvent(new Event('resize'))
    },
  },
}
</script>

<style lang="scss">
.vue-grid-item.vue-grid-placeholder {
  background: var(--primary) !important;
}
</style>
