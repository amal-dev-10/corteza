<template>
  <b-sidebar
    v-model="isVisible"
    :title="title"
    header-class="d-flex align-items-center justify-content-between reminder-sidebar-header p-3 border-bottom"
    body-class="d-flex flex-column overflow-hidden bg-white"
    :backdrop="isMobile"
    no-footer
    right
    shadow="sm"
    no-close-on-route-change
    no-close-on-esc
  >
    <template #header>
      <h4
        class="text-primary mb-0"
      >
        <b>{{ title }}</b>
      </h4>

      <b-button
        variant="outline-light"
        class="d-flex align-items-center justify-content-center p-2 border-0 text-secondary"
        @click="isVisible = false"
      >
        <font-awesome-icon
          :icon="['fas', 'times']"
          class="h6 mb-0"
        />
      </b-button>
    </template>

    <slot />
  </b-sidebar>
</template>

<script lang="js">
export default {
  props: {
    title: {
      type: String,
      default: '',
    },

    visible: {
      type: Boolean,
      required: false,
      default: false,
    },
  },

  computed: {
    isVisible: {
      get () {
        return this.visible
      },

      set (visible) {
        this.$emit('update:visible', visible)
      },
    },

    isMobile () {
      return window.innerWidth < 576
    },
  },
}
</script>

<style lang="scss">
.reminder-sidebar-header {
  height: 64px;
  background-color: var(--gray-200);
}
</style>
