<template>
  <b-dropdown
    menu-class="text-center"
    variant="link"
    boundary="window"
  >
    <template #button-content>
      <span class="text-dark font-weight-bold">
        <span :class="rootActiveClasses()">
          <font-awesome-icon
            v-if="format.icon"
            :icon="format.icon"
          />
          <span v-else>
            {{ format.label }}
          </span>
        </span>
      </span>
    </template>

    <b-dropdown-item-button
      v-for="v of format.variants"
      :key="v.variant"
      @click="dispatchTransaction(v)"
    >
      <b-button
        variant="link"
        class="text-dark font-weight-bold"
      >
        <span :class="activeClasses(v.attrs)">
          <font-awesome-icon
            v-if="format.icon"
            :icon="v.icon"
          />
          <span v-else>
            {{ v.label }}
          </span>
        </span>
      </b-button>
    </b-dropdown-item-button>
  </b-dropdown>
</template>

<script>
import base from '../TNode/base.vue'
import { nodeTypes } from '../../lib/formats'

/**
 * Component is used to display node alignment formatting
 */
export default {
  name: 'TNattrAlignment',
  extends: base,

  props: {
    isActive: {
      type: Object,
      required: false,
      default: () => ({}),
    },
  },

  methods: {
    activeClasses (attrs) {
      const an = this.activeNode(nodeTypes, attrs)
      if (!an || !an.node) {
        return undefined
      }

      const ac = (type, attrs) => {
        const b = (this.isActive[type])
        return b && (b(attrs))
      }
      if (ac(an.node.type.name, { ...an.node.attrs, ...attrs })) {
        return ['text-success']
      }

      return undefined
    },

    /**
     * dispatches node attr update for all affected nodes
     * use a single transaction, so ctrl + z works as intended
     */
    dispatchTransaction (v) {
      const ann = this.activeNodes(nodeTypes)
      const tr = this.$attrs.editor.state.tr
      for (const an of ann) {
        tr.setNodeMarkup(an.position, an.node.type, { ...an.node.attrs, ...v.attrs })
      }
      this.$attrs.editor.dispatchTransaction(tr)
    },

    /**
     * Helper method to determine if the root formater should be shown as active
     * @returns {Array|undefined}
     */
    rootActiveClasses () {
      if (this.format.variants.find(({ attrs }) => this.activeClasses(attrs))) {
        return ['text-success']
      }
    },
  },
}
</script>
