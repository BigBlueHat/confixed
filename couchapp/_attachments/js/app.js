Vue.use(VueResource);
Vue.config.debug = true;
var app = new Vue({
  el: document.body,
  data: {
    current: '',
    current_rev: '',
    doc_ids: [],
    conflicts: {}
  },
  computed: {
    current_conflict_count: function() {
      if (this.current && this.current in this.conflicts) {
        return this.conflicts[this.current].length;
      }
    }
  },
  ready: function() {
    this.loadConflicts();
  },
  watch: {
    current: function(id) {
      var self = this;
      if (id) {
        this.$http.get('../../' + encodeURIComponent(id))
          .then(function(resp) {
            // pulled from json-diff
            leftInputView.codemirror
              .setValue(JSON.stringify(resp.data, null, "\t"));
          })
          .catch(console.log.bind(console));
      }
    },
    current_rev: function(rev) {
      var self = this;
      if (rev === '') {
        rightInputView.codemirror.setValue('');
      } else if (rev) {
        this.$http.get('../../'
            + encodeURIComponent(this.current)
            + '?rev=' + rev)
          .then(function(resp) {
            // pulled from json-diff
            rightInputView.codemirror
              .setValue(JSON.stringify(resp.data, null, "\t"));
          })
          .catch(console.log.bind(console));
      }
    }
  },
  methods: {
    compare: function() {
      // from json-diff
      compareJson();
    },
    resolve: function() {
      var self = this;
      var bulk = {
        all_or_nothing: true,
        docs: []
      };
      // add new doc revision from left side
      bulk.docs.push(JSON.parse(leftInputView.codemirror.getValue()));
      // add the `delete` request docs for the conflicted doc ids
      for (var i = 0; i < this.conflicts[this.current].length; i++) {
        bulk.docs.push({
          _id: this.current,
          _rev: this.conflicts[this.current][i],
          _deleted: true
        });
      }
      this.$http
        .post('../../_bulk_docs', bulk)
        .then(function(resp) {
          alert(resp.statusText);
          // keep this console.log until there's UI
          console.log(resp);
          self.loadConflicts();
        })
        .catch(console.log.bind(console));
    },
    resetDefaults: function() {
      // reset to defaults
      this.$set('current', '');
      this.$set('current_rev', '');
      this.$set('doc_ids', []);
      this.$set('conflicts', {});
      // TODO: use Vue for these bits too
      leftInputView.codemirror.setValue('');
      rightInputView.codemirror.setValue('');
    },
    loadConflicts: function() {
      var self = this;
      this.resetDefaults();
      this.$http.get('_view/conflicts')
        .then(function(resp) {
          if (resp.data.total_rows > 0) {
            resp.data.rows.forEach(function(row) {
              self.doc_ids.push(row.id);
              self.conflicts[row.id] = row.value;
            });
          }
        })
        .catch(console.log.bind(console));
    }
  }
});
