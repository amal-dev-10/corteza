<template>
  <div
    class="d-flex w-100"
  >
    <namespace-sidebar
      v-if="namespaces.length"
      :namespaces="namespaces"
    />

    <portal
      to="topbar-avatar-dropdown"
    >
      <b-dropdown-item-button
        data-test-id="dropdown-item-reminders"
        @click="remindersVisible = true"
      >
        {{ $t('reminder.listLabel') }}
      </b-dropdown-item-button>
    </portal>

    <c-reminder-sidebar
      :title="$t('reminder.listLabel')"
      :visible.sync="remindersVisible"
    >
      <reminders />
    </c-reminder-sidebar>

    <router-view
      v-if="loaded"
      class="pb-safari"
    />
  </div>
</template>

<script>
import NamespaceSidebar from 'corteza-webapp-compose/src/components/Namespaces/NamespaceSidebar'
import Reminders from 'corteza-webapp-compose/src/components/Namespaces/Reminders'
import { components } from '@cortezaproject/corteza-vue'
const { CReminderSidebar } = components

export default {
  i18nOptions: {
    namespaces: 'general',
  },

  components: {
    NamespaceSidebar,
    CReminderSidebar,
    Reminders,
  },

  data () {
    return {
      loaded: false,

      query: '',
      namespaces: [],

      remindersVisible: false,
    }
  },

  created () {
    // Preload first 500 users
    this.$store.dispatch('user/load', { limit: 500 })

    this.$store.dispatch('namespace/load', { force: true }).then(namespaces => {
      this.namespaces = namespaces
      this.loaded = true
    }).catch(this.toastErrorHandler(this.$t('notification:general.composeAccessNotAllowed')))

    this.$root.$on('reminders.show', () => {
      this.remindersVisible = true
    })
  },

  beforeDestroy () {
    this.setDefaultValues()
  },

  methods: {
    setDefaultValues () {
      this.loaded = false
      this.query = ''
      this.namespaces = []
      this.remindersVisible = false
    },
  },
}
</script>

<style scoped>
/* fixes bottom part of page being cut off */

/* CSS specific to iOS devices */
@supports (-webkit-touch-callout: none) {
  .pb-safari {
    padding-bottom: 5.5em;
  }
}
</style>
