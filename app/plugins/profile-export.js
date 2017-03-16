const fs = require('fs');
const path = require('path');
const eol = require('os').EOL;

module.exports = {
  defaultConfig: {
    enabled: true,
    sortData: true
  },
  defaultConfigDetails: {
    sortData: { label: 'Sort data like ingame' }
  },
  pluginName: 'ProfileExport',
  init(proxy, config) {
    proxy.on('HubUserLogin', (req, resp) => {
      if (config.Config.Plugins[this.pluginName].enabled) {
        if (config.Config.Plugins[this.pluginName].sortData)
          var resp = this.sortUserData(resp);
        this.writeProfileToFile(proxy, req, resp);
      }   
    });
  },
  writeProfileToFile(proxy, req, resp) {
    const wizard_id = resp.wizard_info.wizard_id;
    const filename = wizard_id.toString().concat('.json');

    var outFile = fs.createWriteStream(
      path.join(config.Config.App.filesPath, filename), {
        flags: 'w',
        autoClose: true
      }
    );

    outFile.write(JSON.stringify(resp, true, 2));
    outFile.end();
    proxy.log({ type: 'success', source: 'plugin', name: this.pluginName, message: 'Saved profile data to '.concat(filename) });
  },
  sortUserData(data) {
    // get storage building id
    let storage_id;
    for (let building of data['building_list']) {
      if (building['building_master_id'] == 25)
        storage_id = building['building_id'];
    }
    // generic sort function
    cmp = function(x, y){
      return x > y ? 1 : x < y ? -1 : 0; 
    };

    // sort monsters
    data['unit_list'] = data['unit_list'].sort((a, b) => {
      return cmp( 
          [
            cmp((a.building_id == storage_id) ? 1 : 0, (b.building_id == storage_id) ? 1 : 0),
            -cmp(a.class, b.class),
            -cmp(a.unit_level, b.unit_level),
            cmp(a.attribute, b.attribute),
            cmp(a.unit_id, b.unit_id)
          ],
          [
            cmp((b.building_id == storage_id) ? 1 : 0, (a.building_id == storage_id) ? 1 : 0),
            -cmp(b.class, a.class),
            -cmp(b.unit_level, a.unit_level),
            cmp(b.attribute, a.attribute),
            cmp(b.unit_id, a.unit_id)
          ]
      );
    });

    // sort runes on monsters
    for (let monster of data['unit_list']) {
      // make sure that runes is actually an object (thanks com2us)
      if (monster['runes'] === Object(monster['runes']))
        monster['runes'] = Object.values(monster['runes']);

      monster['runes'] = monster['runes'].sort((a, b) => {
        return cmp( 
            [cmp(a.slot_no, b.slot_no)],
            [cmp(b.slot_no, a.slot_no)]
        );
      });
    }

    // make sure that runes is actually an object (thanks again com2us)
      if (data['runes'] === Object(data['runes']))
        data['runes'] = Object.values(data['runes']);

    // sort runes in inventory
    data['runes'] = data['runes'].sort((a, b) => {
      return cmp( 
          [cmp(a.set_id, b.set_id), cmp(a.slot_no, b.slot_no)],
          [cmp(b.set_id, a.set_id), cmp(b.slot_no, a.slot_no)]
      );
    });

    // sort crafts
    data['rune_craft_item_list'] = data['rune_craft_item_list'].sort((a, b) => {
      return cmp( 
          [cmp(a.craft_type, b.craft_type), cmp(a.craft_item_id, b.craft_item_id)],
          [cmp(b.craft_type, a.craft_type), cmp(b.craft_item_id, a.craft_item_id)]
      );
    });

    return data;
  }
}