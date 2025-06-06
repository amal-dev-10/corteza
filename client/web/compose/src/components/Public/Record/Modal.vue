<template>
  <b-modal
    id="record-modal"
    v-model="showModal"
    scrollable
    :dialog-class="dialogClass"
    content-class="position-initial"
    body-class="p-0"
    footer-class="p-0 overflow-hidden"
    size="xl"
    @hidden="onHidden"
  >
    <template #modal-title>
      <portal-target
        name="record-modal-header"
      />
    </template>

    <view-record
      v-if="showModal"
      :namespace="namespace"
      :page="page"
      :module="module"
      :record-i-d="recordID"
      :values="values"
      :ref-record="refRecord"
      :edit="edit"
      in-modal
      @handle-record-redirect="loadRecord"
      @on-modal-back="loadRecord"
    />

    <template #modal-footer>
      <portal-target
        name="record-modal-footer"
        class="w-100 m-0"
      />
    </template>
  </b-modal>
</template>

<script>
import { NoID, compose } from '@cortezaproject/corteza-js'
import { mapGetters, mapActions } from 'vuex'
import record from 'corteza-webapp-compose/src/mixins/record'
import ViewRecord from 'corteza-webapp-compose/src/views/Public/Pages/Records/View'

export default {
  i18nOptions: {
    namespaces: 'block',
  },

  name: 'RecordModal',

  components: {
    ViewRecord,
  },

  mixins: [
    record,
  ],

  props: {
    namespace: {
      type: compose.Namespace,
      required: true,
    },
  },

  data () {
    return {
      showModal: false,
      recordID: undefined,
      module: undefined,
      page: undefined,
      values: undefined,
      refRecord: undefined,
      edit: false,
    }
  },

  computed: {
    ...mapGetters({
      getModuleByID: 'module/getByID',
      getPageByID: 'page/getByID',
      recordPaginationUsable: 'ui/recordPaginationUsable',
      modalPreviousPages: 'ui/modalPreviousPages',
      modalPageHandle: 'ui/modalPageHandle',
      modalLayoutHandle: 'ui/modalLayoutHandle',
    }),

    uniqueID () {
      const { recordPageID, recordID, edit = false } = this.$route.query
      const isEdit = typeof edit === 'string' ? edit === 'true' : Boolean(edit)
      return [recordPageID, recordID, isEdit]
    },

    dialogClass () {
      const classes = ['h-100', 'mw-90']

      if (this.modalPageHandle) {
        classes.push(`page-${this.modalPageHandle}-modal`)
      }

      if (this.modalLayoutHandle) {
        classes.push(`layout-${this.modalLayoutHandle}-modal`)
      }

      return classes.join(' ')
    },
  },

  watch: {
    uniqueID: {
      immediate: true,
      handler (value = [], oldValue = []) {
        const [recordPageID, recordID, edit] = value
        const [oldRecordPageID] = oldValue

        if (!recordPageID) {
          this.setDefaultValues()
          this.clearModalPreviousPage()
        }

        if (recordPageID !== oldRecordPageID) {
          // If the page changed we need to clear the record pagination since its not relevant anymore
          if (this.recordPaginationUsable) {
            this.setRecordPaginationUsable(false)
          } else {
            this.clearRecordIDs()
          }
        }

        if (!recordPageID) {
          return
        }

        if (recordID !== this.recordID || recordPageID !== (this.page || {}).pageID || edit !== this.edit) {
          this.loadRecord({ recordID, recordPageID, edit })
        }
      },
    },
  },

  mounted () {
    this.$root.$on('show-record-modal', this.loadRecord)
  },

  beforeDestroy () {
    this.destroyEvents()
    this.setDefaultValues()
  },

  methods: {
    ...mapActions({
      setRecordPaginationUsable: 'ui/setRecordPaginationUsable',
      clearRecordIDs: 'ui/clearRecordIDs',
      pushModalPreviousPage: 'ui/pushModalPreviousPage',
      clearModalPreviousPage: 'ui/clearModalPreviousPage',
      setModalPageHandle: 'ui/setModalPageHandle',
      setModalLayoutHandle: 'ui/setModalLayoutHandle',
    }),

    loadRecord ({ recordID, recordPageID, values = this.$route.params.values, refRecord, edit = this.edit, pushModalPreviousPage = true }) {
      if (!recordID && !recordPageID) {
        this.onHidden()
        return
      }

      this.recordID = recordID
      this.values = values
      this.refRecord = refRecord
      this.edit = edit || !recordID || recordID === NoID

      this.loadModal({ recordID, recordPageID })

      // Push the previous modal view page to the modal route history stack on the store so we can go back to it
      if (pushModalPreviousPage) {
        this.pushModalPreviousPage({ recordID, recordPageID, edit })
      }

      setTimeout(() => {
        this.$router.push({
          query: {
            ...this.$route.query,
            recordID,
            recordPageID,
            edit,
          },
        })
      })
    },

    loadModal ({ recordID, recordPageID }) {
      if (recordID && recordPageID) {
        this.recordID = recordID

        if (!this.page || this.page.pageID !== recordPageID) {
          this.page = this.getPageByID(recordPageID)
          this.setModalPageHandle(this.page.handle)
        }

        if (this.page && (!this.module || this.module.moduleID !== this.page.moduleID)) {
          this.module = this.getModuleByID(this.page.moduleID)
        }

        if (this.page && this.module) {
          this.showModal = true
        }
      }
    },

    onHidden () {
      this.setDefaultValues()

      setTimeout(() => {
        if (this.recordID === undefined && this.page === undefined) {
          this.$router.replace({
            query: {
              ...this.$route.query,
              recordID: undefined,
              moduleID: undefined,
              recordPageID: undefined,
              edit: undefined,
            },
          })
        }

        this.setModalPageHandle(undefined)
        this.setModalLayoutHandle(undefined)
      })
    },

    setDefaultValues () {
      this.showModal = false
      this.edit = false
      this.recordID = undefined
      this.module = undefined
      this.page = undefined
      this.values = undefined
      this.refRecord = undefined
      this.clearModalPreviousPage()
    },

    destroyEvents () {
      this.$root.$off('show-record-modal', this.loadRecord)
    },
  },
}

</script>

<style lang="scss">
.mw-90 {
  max-width: 90vw;
}

.position-initial {
  position: initial;
}

#record-modal {
  .modal-header {
    h5 {
      min-height: 27px;
    }
  }

  .modal-body {
    background-color: var(--body-bg);
  }
}
</style>
