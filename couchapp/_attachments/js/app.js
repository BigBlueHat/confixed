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
  ready: function() {
    var self = this;
    this.$http.get('_view/conflicts')
      .then(function(resp) {
        if (resp.data.total_rows > 0) {
          resp.data.rows.forEach(function(row) {
            self.doc_ids.push(row.id);
            self.conflicts[row.id] = row.value;
          });
          self.$log();
        }
      })
      .catch(console.log.bind(console));
  },
  watch: {
    current: function(id) {
      var self = this;
      this.$http.get('../../' + encodeURIComponent(id))
        .then(function(resp) {
          // pulled from json-diff
          leftInputView.codemirror
            .setValue(JSON.stringify(resp.data, null, "\t"));
        })
        .catch(console.log.bind(console));
    },
    current_rev: function(rev) {
      if (rev === '') {
        rightInputView.codemirror.setValue('');
      }
      var self = this;
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
});
