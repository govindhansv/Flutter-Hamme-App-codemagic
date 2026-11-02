import Flutter
import UIKit

@main
@objc class AppDelegate: FlutterAppDelegate, FlutterImplicitEngineDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  // With the UIScene lifecycle (required since iOS 27) the Flutter engine is
  // created by the scene, after didFinishLaunching, so plugins and channels
  // must be registered here instead.
  func didInitializeImplicitFlutterEngine(_ engineBridge: FlutterImplicitEngineBridge) {
    GeneratedPluginRegistrant.register(with: engineBridge.pluginRegistry)
    if let registrar = engineBridge.pluginRegistry.registrar(forPlugin: "HammeShareStory") {
      let channel = FlutterMethodChannel(
        name: "hamme/share_story",
        binaryMessenger: registrar.messenger()
      )
      channel.setMethodCallHandler(handleShareStory)
    }
  }

  private func handleShareStory(call: FlutterMethodCall, result: @escaping FlutterResult) {
    switch call.method {
    case "isInstagramInstalled":
      result(canOpen("instagram-stories://share"))
    case "isSnapchatInstalled":
      result(canOpen("snapchat://"))
    case "shareToInstagramStory":
      guard let args = call.arguments as? [String: Any],
            let imagePath = args["imagePath"] as? String else {
        result(FlutterError(code: "INVALID_ARGS", message: "imagePath is required", details: nil))
        return
      }
      // Instagram requires the Meta App ID; it is set as MetaAppID in Info.plist.
      guard let appId = Bundle.main.object(forInfoDictionaryKey: "MetaAppID") as? String,
            Int(appId) != nil else {
        NSLog("Instagram Stories disabled: MetaAppID missing or invalid in Info.plist")
        result("NOT_CONFIGURED")
        return
      }
      shareToInstagramStory(
        imagePath: imagePath,
        appId: appId,
        attributionUrl: args["attributionUrl"] as? String,
        result: result
      )
    case "shareToSnapchatStory":
      guard let args = call.arguments as? [String: Any],
            let imagePath = args["imagePath"] as? String else {
        result(FlutterError(code: "INVALID_ARGS", message: "imagePath is required", details: nil))
        return
      }
      // Creative Kit requires the Snap Kit client ID; it is set as SnapClientID in Info.plist.
      guard let clientId = Bundle.main.object(forInfoDictionaryKey: "SnapClientID") as? String,
            !clientId.isEmpty else {
        NSLog("Snapchat Creative Kit disabled: SnapClientID missing in Info.plist")
        result("NOT_CONFIGURED")
        return
      }
      shareToSnapchatPreview(imagePath: imagePath, clientId: clientId, result: result)
    default:
      result(FlutterMethodNotImplemented)
    }
  }

  private func canOpen(_ urlString: String) -> Bool {
    guard let url = URL(string: urlString) else { return false }
    return UIApplication.shared.canOpenURL(url)
  }

  // Snap Creative Kit (no-SDK "Lite" flow): Snapchat reads the image from the
  // pasteboard and opens it full screen in its Preview editor. checkcount lets
  // Snapchat verify the pasteboard wasn't changed after we wrote it.
  private func shareToSnapchatPreview(
    imagePath: String,
    clientId: String,
    result: @escaping FlutterResult
  ) {
    guard var components = URLComponents(string: "snapchat://creativekit/preview/1"),
          let baseUrl = components.url,
          UIApplication.shared.canOpenURL(baseUrl) else {
      result("NOT_INSTALLED")
      return
    }
    guard let imageData = FileManager.default.contents(atPath: imagePath) else {
      result(FlutterError(code: "IMAGE_ERROR", message: "Could not read story image", details: nil))
      return
    }

    UIPasteboard.general.setItems(
      [[
        "com.snapchat.creativekit.clientID": clientId,
        "com.snapchat.creativekit.backgroundImage": imageData,
      ]],
      options: [.expirationDate: Date().addingTimeInterval(60 * 5)]
    )

    let appName = (Bundle.main.object(forInfoDictionaryKey: "CFBundleDisplayName") as? String)
      ?? (Bundle.main.object(forInfoDictionaryKey: kCFBundleNameKey as String) as? String)
    components.queryItems = [
      URLQueryItem(name: "checkcount", value: String(UIPasteboard.general.changeCount)),
      URLQueryItem(name: "clientId", value: clientId),
      URLQueryItem(name: "appDisplayName", value: appName),
    ]
    guard let url = components.url else {
      result("OPEN_FAILED")
      return
    }
    UIApplication.shared.open(url, options: [:]) { opened in
      result(opened ? "SUCCESS" : "OPEN_FAILED")
    }
  }

  // Instagram reads the story from the pasteboard. Only real Data values may be
  // set: empty placeholders for unused keys (sticker/video) make Instagram open
  // with a blank story or reject the share.
  private func shareToInstagramStory(
    imagePath: String,
    appId: String,
    attributionUrl: String?,
    result: @escaping FlutterResult
  ) {
    guard let url = URL(string: "instagram-stories://share?source_application=\(appId)"),
          UIApplication.shared.canOpenURL(url) else {
      result("NOT_INSTALLED")
      return
    }
    guard let imageData = FileManager.default.contents(atPath: imagePath) else {
      result(FlutterError(code: "IMAGE_ERROR", message: "Could not read story image", details: nil))
      return
    }

    var item: [String: Any] = [
      "com.instagram.sharedSticker.backgroundImage": imageData,
      "com.instagram.sharedSticker.backgroundTopColor": "#9F6FFF",
      "com.instagram.sharedSticker.backgroundBottomColor": "#9F6FFF",
    ]
    if let attributionUrl = attributionUrl, !attributionUrl.isEmpty {
      item["com.instagram.sharedSticker.contentURL"] = attributionUrl
    }

    UIPasteboard.general.setItems(
      [item],
      options: [.expirationDate: Date().addingTimeInterval(60 * 5)]
    )
    UIApplication.shared.open(url, options: [:]) { opened in
      result(opened ? "SUCCESS" : "OPEN_FAILED")
    }
  }
}
