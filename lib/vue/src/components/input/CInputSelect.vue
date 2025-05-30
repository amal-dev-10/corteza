<template>
  <vue-select
    v-bind="$attrs"
    ref="vueSelect"
    v-model="_value"
    data-test-id="select"
    :clearable="clearable"
    :options="options"
    :searchable="searchable"
    :disabled="disabled"
    :selectable="selectable"
    :multiple="multiple"
    :loading="loading"
    :calculate-position="calculateDropdownPosition"
    :append-to-body="appendToBody"
    class="bg-white rounded"
    :class="sizeClass"
    @search="onSearch"
  >
    <template
      v-for="(_, name) in $scopedSlots"
      #[name]="data"
    >
      <slot
        :name="name"
        v-bind="data"
      />
    </template>

    <template
      v-if="badge"
      #option="option"
    >
      <span
        class="badge badge-pill"
        :style="getOptionStyle(option)"
      >
        {{ option.text }}
      </span>
    </template>

    <template
      v-if="!multiple && badge"
      #selected-option="option"
    >
      <span
        class="badge badge-pill"
        :style="getOptionStyle(option)"
      >
        {{ option.text }}
      </span>
    </template>

    <template
      v-if="multiple && badge"
      #selected-option-container="{ option, deselect }"
    >
      <span
        class="d-flex align-items-center badge badge-pill mx-1 mt-1 w-auto"
        :style="getOptionStyle(option)"
      >
        {{ option.text }}

        <font-awesome-icon
          :icon="['fas', 'times']"
          class="pointer ml-2"
          @click="deselect(option)"
        />
      </span>
    </template>
  </vue-select>
</template>

<script>
import { VueSelect } from 'vue-select'
import { createPopper } from '@popperjs/core'
import 'vue-select/dist/vue-select.css'

export default {
  name: 'CInputSelect',

  components: {
    VueSelect,
  },

  props: {
    value: {
      type: [String, Array, Object],
      default: () => '',
    },

    options: {
      type: Array,
      default: () => {
        return []
      },
    },

    clearable: {
      type: Boolean,
      default: true,
    },

    searchable: {
      type: Boolean,
      default: true,
    },

    appendToBody: {
      type: Boolean,
      default: true,
    },

    defaultValue: {
      type: [String, Array, Object],
      default: () => '',
    },

    size: {
      type: String,
      default: 'md',
    },

    disabled: {
      type: Boolean,
      default: false,
    },

    selectable: {
      type: Function,
      default: o => !o.disabled,
    },

    multiple: {
      type: Boolean,
      default: false,
    },

    loading: {
      type: Boolean,
      default: false,
    },

    badge: {
      type: Boolean,
      default: false,
    },
  },

  data () {
    return {
      query: '',
    }
  },

  computed: {
    _value: {
      get () {
        const fallbackValue = this.multiple ? [] : ''
        return !!this.defaultValue && (this.value === this.defaultValue) ? fallbackValue : this.value
      },

      set (v) {
        this.$emit('input', !v ? this.defaultValue : v)
      },
    },

    sizeClass () {
      return this.size === 'sm' ? 'c-input-sm' : this.size === 'lg' ? 'c-input-lg' : ''
    },
  },

  methods: {
    calculateDropdownPosition (dropdownList, component, { width }) {
      /**
       * We need to explicitly define the dropdown width since
       * it is usually inherited from the parent with CSS.
       */
      dropdownList.style.width = width

      /**
       * Here we position the dropdownList relative to the $refs.toggle Element.
       *
       * The 'offset' modifier aligns the dropdown so that the $refs.toggle and
       * the dropdownList overlap by 1 pixel.
       *
       * The 'toggleClass' modifier adds a 'drop-up' class to the Vue Select
       * wrapper so that we can set some styles for when the dropdown is placed
       * above.
       */
      const popper = createPopper(component.$refs.toggle, dropdownList, {
        placement: 'bottom',
        modifiers: [
          {
            name: 'offset',
            options: {
              offset: [0, -1],
            },
          },
          {
            name: 'toggleClass',
            enabled: true,
            phase: 'write',
            fn ({ state }) {
              component.$el.classList.toggle('drop-up', state.placement === 'top')
            },
          }],
      })

      /**
       * To prevent memory leaks Popper needs to be destroyed.
       * If you return function, it will be called just before dropdown is removed from DOM.
       */
      return () => popper.destroy()
    },

    onSearch (query, loading) {
      if (this.loading) {
        if (this.$refs.vueSelect) {
          this.$refs.vueSelect._data.search = this.query
        }

        return
      }

      if (query !== this.query) {
        this.query = query
      }

      this.$emit('search', query, loading)
    },

    getOptionStyle ({ style = {} } = {}) {
      if (this.badge) {
        style.fontSize = '0.9rem'
        style.color = style.textColor || 'var(--dark)'
        style.backgroundColor = style.backgroundColor || 'var(--extra-light)'
      }

      return style
    },
  },
}
</script>

<style lang="scss">
:root {
  --vs-dropdown-bg: var(--white);
  --vs-dropdown-option--active-bg: var(--light);
  --vs-state-disabled-color: var(--secondary);
  --vs-state-disabled-bg: var(--light);
  --vs-colors--light: var(--black);
  --vs-colors--dark: var(--black);
  --vs-dropdown-option-color: var(--black);
  --vs-dropdown-option--active-color: var(--black);
  --vs-selected-bg: var(--extra-light);
  --vs-search-input-color: var(--secondary);
  --vs-search-input-bg: var(--white);
}

.v-select {
  min-width: auto;
  position: relative;
  -ms-flex: 1 1 auto;
  flex: 1 1 auto;
  margin-bottom: 0;
  font-size: .9rem !important;
  font-family: var(--font-regular);

  .vs__selected-options {
    // do not allow growing
    width: 0;
    padding: 0;
  }

  .vs__selected {
    display: block;
    white-space: nowrap;
    text-overflow: ellipsis;
    max-width: 100%;
    overflow: hidden;
    border: 0;
    color: var(--black);
  }

  .vs__search {
    font-size: .9rem;
    border: 0;
    padding: 0 2px;
    padding-top: 0.375rem;
    margin: 0;
  }

  &:not(.vs--open):not(.vs--loading) .vs__selected + .vs__search {
    // force this to not use any space
    // we still need it to be rendered for the focus
    width: 0;
    margin: 0;
    border: none;
    padding: 0;
    height: 0;
  }

  .vs__dropdown-toggle {
    min-height: calc(1.5em + 0.75rem + 4px);
    padding: 0.375rem calc(0.75rem - 2px);
    padding-top: 0 !important;
    border-width: 2px;
    border-color: var(--extra-light);

    .vs__selected {
      margin-top: 0.375rem;
      padding: 0 2px;
    }

    .vs__actions {
      padding-top: 0.375rem;
      padding-right: 0;
    }
  }

  .vs__clear,
  .vs__open-indicator {
    fill: var(--black);
    display: inline-flex;
  }

  .vs__clear {
    padding: 0;
    border: 0;
    background-color: transparent;
    cursor: pointer;
    margin-right: 8px
  }

  &.vs--single {
    .vs__selected {
      margin-left: 0;
      margin-right: 0;
    }
  }
}

.vs--open {
  .vs__dropdown-toggle {
    border-color: var(--primary);
    border-radius: 0.25rem !important;
  }
}

.input-group > .v-select:not(:last-child) {
  .vs__dropdown-toggle {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }
}

.vs__spinner {
  border: .7em solid var(--dark);
  border-left-color: var(--white);
}

.vs__spinner, .vs__spinner::after {
  width: 4em;
  height: 4em;
}

.vs__dropdown-menu {
  z-index: 1100;

  .vs__dropdown-option {
    &.vs__dropdown-option--selected {
      background: var(--vs-dropdown-option--active-bg);
      color: var(--vs-dropdown-option--active-color);
    }

    &.vs__dropdown-option--disabled {
      cursor: var(--vs-state-disabled-cursor) !important;
      opacity: 0.5;
    }

    &:active {
      color: var(--white);
      background-color: var(--primary);
    }
  }
}

.c-input-sm {
  font-size: 0.7875rem !important;

  .vs__search {
    font-size: 0.7875rem;
    padding-top: 0.25rem;
  }

  .vs__dropdown-toggle {
    min-height: calc(1.5em + 0.5rem + 4px);
    padding: 0.25rem calc(0.5rem - 2px);
    border-radius: 0.2rem;

    .vs__selected {
      margin-top: 0.25rem;
    }

    .vs__actions {
      padding-top: 0.25rem;
    }
  }
}
.c-input-lg {
  font-size: 1.125rem !important;

  .vs__search {
    font-size: 1.125rem;
    padding-top: .5rem;
  }

  .vs__dropdown-toggle {
    min-height: calc(1.5em + 1rem + 4px);
    padding: .5rem calc(1rem - 2px);
    border-radius: 0.3rem;

    .vs__selected {
      margin-top: .5rem;
    }

    .vs__actions {
      padding-top: .5rem;
    }
  }
}

</style>
