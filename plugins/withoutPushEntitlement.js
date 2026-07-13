const { withEntitlementsPlist } = require('expo/config-plugins');

// expo-notifications adds the aps-environment (Push Notifications) entitlement
// unconditionally, but free personal signing teams cannot provision that
// capability, and Steward only schedules local notifications — which don't
// need it. Entitlement mods compose in REVERSE plugin-array order, so this
// must stay listed BEFORE expo-notifications in app.json for the delete to
// run after the add.
module.exports = function withoutPushEntitlement(config) {
  return withEntitlementsPlist(config, (c) => {
    delete c.modResults['aps-environment'];
    return c;
  });
};
