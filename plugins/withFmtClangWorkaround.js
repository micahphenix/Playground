const { withPodfile } = require('expo/config-plugins');

// fmt 11.0.2 (pinned by react-native 0.76) fails to compile under Xcode 26.5's
// clang: "call to consteval function ... is not a constant expression" in
// format-inl.h (FMT_STRING + consteval ctor). fmt 11.0.2 ignores a
// -DFMT_USE_CONSTEVAL=0 override (its #define block has no #ifdef guard), but
// its own detection turns consteval off below C++20 — so compile just the fmt
// pod at C++17, which fmt supports. format-inl.h is only compiled inside the
// fmt target, so no other pod is affected. The loop must run AFTER
// react_native_post_install, which resets CLANG_CXX_LANGUAGE_STANDARD on every
// pod target; we anchor on the resource-bundle-signing block that follows it
// in Expo's Podfile template. Remove once RN ships a fixed fmt.
const ANCHOR =
  'installer.target_installation_results.pod_target_installation_results';

const INJECTION = `installer.pods_project.targets.each do |target|
      next unless target.name == 'fmt'
      target.build_configurations.each do |config|
        config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'
      end
    end

    ${ANCHOR}`;

module.exports = function withFmtClangWorkaround(config) {
  return withPodfile(config, (c) => {
    if (!c.modResults.contents.includes("CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'")) {
      if (!c.modResults.contents.includes(ANCHOR)) {
        throw new Error(
          'withFmtClangWorkaround: Podfile template changed — anchor not found'
        );
      }
      c.modResults.contents = c.modResults.contents.replace(ANCHOR, INJECTION);
    }
    return c;
  });
};
