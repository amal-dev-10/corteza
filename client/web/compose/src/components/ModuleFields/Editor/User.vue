<template>
  <b-form-group
    :label-cols-md="horizontal && '5'"
    :label-cols-xl="horizontal && '4'"
    :content-cols-md="horizontal && '7'"
    :content-cols-xl="horizontal && '8'"
    :class="formGroupStyleClasses"
  >
    <template
      #label
    >
      <div
        v-if="!valueOnly"
        class="d-flex align-items-center text-primary p-0"
      >
        <span
          :title="label"
          class="d-inline-block mw-100"
        >
          {{ label }}
        </span>

        <c-hint :tooltip="hint" />

        <slot name="tools" />
      </div>
      <div
        class="small text-muted"
        :class="{ 'mb-1': description }"
      >
        {{ description }}
      </div>
    </template>

    <multi
      v-if="field.isMulti"
      :value.sync="value"
      :errors="errors"
      :single-input="field.options.selectType !== 'each'"
      :show-list="field.options.selectType !== 'multiple'"
    >
      <template #single>
        <c-input-select
          v-if="field.options.selectType === 'default'"
          ref="singleSelect"
          :placeholder="$t('kind.user.suggestionPlaceholder')"
          :options="options"
          :get-option-label="getOptionLabel"
          :get-option-key="getOptionKey"
          :filterable="false"
          :selectable="isSelectable"
          :loading="processing"
          @search="search"
          @input="updateValue($event)"
        >
          <pagination
            v-if="showPagination"
            slot="list-footer"
            :has-prev-page="hasPrevPage"
            :has-next-page="hasNextPage"
            @prev="goToPage(false)"
            @next="goToPage(true)"
          />
        </c-input-select>

        <c-input-select
          v-else-if="field.options.selectType === 'multiple'"
          v-model="multipleSelected"
          :placeholder="$t('kind.user.suggestionPlaceholder')"
          :options="options"
          :get-option-label="getOptionLabel"
          :get-option-key="getOptionKey"
          :filterable="false"
          :selectable="isSelectable"
          :loading="processing"
          multiple
          @search="search"
        >
          <pagination
            v-if="showPagination"
            slot="list-footer"
            :has-prev-page="hasPrevPage"
            :has-next-page="hasNextPage"
            @prev="goToPage(false)"
            @next="goToPage(true)"
          />
        </c-input-select>
      </template>

      <template #default="ctx">
        <c-input-select
          v-if="field.options.selectType === 'each'"
          :placeholder="$t('kind.user.suggestionPlaceholder')"
          :options="options"
          :get-option-label="getOptionLabel"
          :get-option-key="getOptionKey"
          :value="getUserIDByIndex(ctx.index)"
          :filterable="false"
          :selectable="isSelectable"
          :loading="processing"
          @search="search"
          @input="updateValue($event, ctx.index)"
        >
          <pagination
            v-if="showPagination"
            slot="list-footer"
            :has-prev-page="hasPrevPage"
            :has-next-page="hasNextPage"
            @prev="goToPage(false)"
            @next="goToPage(true)"
          />
        </c-input-select>
        <span v-else>{{ getOptionLabel(getUserIDByIndex(ctx.index)) }}</span>
      </template>
    </multi>

    <template v-else>
      <c-input-select
        :placeholder="$t('kind.user.suggestionPlaceholder')"
        :options="options"
        :get-option-label="getOptionLabel"
        :get-option-key="getOptionKey"
        :value="getUserIDByIndex()"
        :clearable="field.name !== 'ownedBy'"
        :filterable="false"
        :selectable="isSelectable"
        :loading="processing"
        @input="updateValue($event)"
        @search="search"
      >
        <pagination
          v-if="showPagination"
          slot="list-footer"
          :has-prev-page="hasPrevPage"
          :has-next-page="hasNextPage"
          @prev="goToPage(false)"
          @next="goToPage(true)"
        />
      </c-input-select>

      <errors :errors="errors" />
    </template>
  </b-form-group>
</template>
<script>
import { debounce } from 'lodash'
import { mapActions, mapGetters } from 'vuex'
import { NoID } from '@cortezaproject/corteza-js'
import base from './base'
import Pagination from '../Common/Pagination.vue'

export default {
  i18nOptions: {
    namespaces: 'field',
  },

  components: {
    Pagination,
  },

  extends: base,

  data () {
    return {
      processing: false,

      users: [],

      filter: {
        query: null,
        limit: 10,
        pageCursor: '',
        prevPage: '',
        nextPage: '',
        roles: [],
      },
    }
  },

  computed: {
    ...mapGetters({
      resolved: 'user/set',
      findByID: 'user/findByID',
    }),

    options () {
      return this.users
    },

    // This is used in the case of using the multiple select option
    multipleSelected: {
      get () {
        const map = userID => {
          return userID && userID !== NoID ? this.findByID(userID) || { userID } : undefined
        }

        return this.field.isMulti ? this.value.map(map) : map(this.value)
      },

      set (users) {
        if (users && Array.isArray(users)) {
          // When adding/removing items from c-input-selects[multiple],
          // we get array of options back

          this.addUserToResolved(users)
          this.value = users.map(({ userID }) => userID)
        }
      },
    },

    showPagination () {
      return this.hasPrevPage || this.hasNextPage
    },

    hasPrevPage () {
      return !!this.filter.prevPage
    },

    hasNextPage () {
      return !!this.filter.nextPage
    },
  },

  watch: {
    value: {
      async handler (value) {
        value = this.field.isMulti ? [...value] : [value]
        if (value) {
          await this.resolveUsers(value)
        }
      },
    },

    'filter.pageCursor': {
      handler (pageCursor) {
        if (pageCursor) {
          this.fetchUsers()
        }
      },
    },
  },

  created () {
    if ((!this.value || this.value.length === 0) && (this.field.options.presetWithAuthenticated || this.field.name === 'ownedBy')) {
      this.updateValue(this.$auth.user)
    }

    this.fetchUsers()
  },

  beforeDestroy () {
    this.setDefaultValues()
  },

  methods: {
    ...mapActions({
      resolveUsers: 'user/resolveUsers',
      addUserToResolved: 'user/push',
    }),

    getOptionKey (user) {
      if (typeof user === 'string') {
        return user
      }
      return user.userID
    },

    getOptionLabel (user) {
      if (typeof user === 'string') {
        user = this.findByID(user)
      }

      const { name, username, email, userID } = user || {}
      return name || username || email || `<@${userID}>`
    },

    isSelectable ({ userID } = {}) {
      if (!userID) {
        return false
      }

      if (this.field.isMulti) {
        return !this.field.options.isUniqueMultiValue || !this.value.includes(userID)
      } else {
        return this.value !== userID
      }
    },

    /**
     * Updates record value with user
     *
     * Handles single & multi value fields
     */
    updateValue (user, index = -1) {
      // reset singleSelect value for better value presentation
      if (this.$refs.singleSelect) {
        this.$refs.singleSelect._data._value = undefined
      }

      if (user) {
        // update list of resolved users for every item we add
        this.addUserToResolved({ ...user })

        // update value on record
        const { userID } = user
        if (this.field.isMulti) {
          if (index >= 0) {
            this.value.splice(index, 1, userID)
          } else {
            // <0, assume we're appending
            this.value.push(userID)
          }
        } else {
          this.value = userID
        }
      } else {
        if (index >= 0) {
          this.value.splice(index, 1)
        } else {
          this.value = undefined
        }
      }

      this.$emit('change', this.value)
    },

    /**
     * Retrives user (via value) from record field
     * Handles single & multi value fields
     */
    getUserIDByIndex (index = 0) {
      const value = this.field.isMulti ? this.value[index] : this.value
      return value && value !== NoID ? value : undefined
    },

    search: debounce(function (query = '') {
      if (query !== this.filter.query) {
        this.filter.query = query
        this.filter.pageCursor = undefined
      }

      this.fetchUsers()
    }, 300),

    fetchUsers () {
      this.processing = true

      const roleID = this.field.options.roles || []

      this.$SystemAPI.userList({ ...this.filter, roleID })
        .then(({ filter, set }) => {
          this.filter = { ...this.filter, ...filter }
          this.filter.nextPage = filter.nextPage
          this.filter.prevPage = filter.prevPage
          this.users = set.map(m => Object.freeze(m))
          return { filter, set }
        })
        .finally(() => {
          this.processing = false
        })
    },

    goToPage (next = true) {
      this.filter.pageCursor = next ? this.filter.nextPage : this.filter.prevPage
    },

    setDefaultValues () {
      this.processing = false
      this.users = []
      this.filter = {}
    },
  },
}
</script>
