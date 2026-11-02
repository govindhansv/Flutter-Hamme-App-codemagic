package com.hamme.app

import android.app.PendingIntent
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.util.Log
import androidx.core.content.FileProvider
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.embedding.android.FlutterActivity
import io.flutter.plugin.common.MethodChannel
import io.flutter.plugins.GeneratedPluginRegistrant
import java.io.File

class MainActivity : FlutterActivity() {
    companion object {
        private const val CHANNEL = "hamme/share_story"
        private const val INSTAGRAM_PACKAGE = "com.instagram.android"
        private const val TAG = "HammeStoryShare"
        private const val SNAP_CLIENT_ID_KEY = "com.hamme.app.SNAP_CLIENT_ID"
        private const val SNAP_REQUEST_CODE = 9834
    }

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        GeneratedPluginRegistrant.registerWith(flutterEngine)
        Log.d(TAG, "configureFlutterEngine called; initializing channel: $CHANNEL")
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            Log.d(TAG, "Received method call: ${call.method}")
            when (call.method) {
                "shareToInstagramStory" -> {
                    val path = call.argument<String>("imagePath")
                    val link = call.argument<String>("attributionUrl")
                    if (path.isNullOrBlank()) {
                        result.error("INVALID_PATH", "imagePath is required", null)
                        return@setMethodCallHandler
                    }
                    shareToSocialStory(path, link, "com.instagram.android", "com.instagram.share.ADD_TO_STORY", "content_url", result)
                }
                "shareToSnapchatStory" -> {
                    val path = call.argument<String>("imagePath")
                    val link = call.argument<String>("attributionUrl")
                    if (path.isNullOrBlank()) {
                        result.error("INVALID_PATH", "imagePath is required", null)
                        return@setMethodCallHandler
                    }
                    shareToSnapchat(path, link, result)
                }
                "isInstagramInstalled" -> {
                    result.success(isPackageInstalled("com.instagram.android"))
                }
                "isSnapchatInstalled" -> {
                    result.success(isPackageInstalled("com.snapchat.android"))
                }
                else -> result.notImplemented()
            }
        }
    }

    private fun isPackageInstalled(packageName: String): Boolean {
        return try {
            packageManager.getPackageInfo(packageName, 0)
            true
        } catch (_: Exception) {
            false
        }
    }

    private fun snapClientId(): String? {
        return try {
            packageManager.getApplicationInfo(packageName, PackageManager.GET_META_DATA)
                .metaData?.getString(SNAP_CLIENT_ID_KEY)?.takeIf { it.isNotBlank() }
        } catch (_: Exception) {
            null
        }
    }

    // Snap Creative Kit (no-SDK "Lite" flow) opens the image full screen in
    // Snapchat's Preview editor. Without a client ID, or on a Snapchat build
    // that can't handle it, fall back to a plain targeted ACTION_SEND.
    private fun shareToSnapchat(imagePath: String, attributionUrl: String?, result: MethodChannel.Result) {
        val packageName = "com.snapchat.android"
        try {
            val imageFile = File(imagePath)
            if (!imageFile.exists()) {
                result.error("FILE_NOT_FOUND", "PNG file does not exist at path: $imagePath", null)
                return
            }

            val authority = "${applicationContext.packageName}.fileprovider"
            val contentUri: Uri = FileProvider.getUriForFile(applicationContext, authority, imageFile)

            val clientId = snapClientId()
            if (clientId != null) {
                val creativeKitIntent = Intent(Intent.ACTION_SEND).apply {
                    setPackage(packageName)
                    setDataAndType(Uri.parse("snapchat://creativekit/preview"), "image/*")
                    putExtra("CLIENT_ID", clientId)
                    putExtra(Intent.EXTRA_STREAM, contentUri)
                    putExtra(
                        "RESULT_INTENT",
                        PendingIntent.getActivity(
                            this@MainActivity,
                            SNAP_REQUEST_CODE,
                            Intent(),
                            PendingIntent.FLAG_IMMUTABLE
                        )
                    )
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                        Intent.FLAG_ACTIVITY_CLEAR_TOP or
                        Intent.FLAG_GRANT_READ_URI_PERMISSION
                }
                if (creativeKitIntent.resolveActivity(packageManager) != null) {
                    grantUriPermission(packageName, contentUri, Intent.FLAG_GRANT_READ_URI_PERMISSION)
                    startActivity(creativeKitIntent)
                    result.success("SUCCESS")
                    return
                }
                Log.w(TAG, "Snapchat Creative Kit intent not resolved; using ACTION_SEND")
            }

            val intent = Intent(Intent.ACTION_SEND).apply {
                type = "image/png"
                putExtra(Intent.EXTRA_STREAM, contentUri)
                if (!attributionUrl.isNullOrBlank()) {
                    putExtra(Intent.EXTRA_TEXT, attributionUrl)
                }
                flags = Intent.FLAG_GRANT_READ_URI_PERMISSION
                setPackage(packageName)
            }

            if (intent.resolveActivity(packageManager) == null) {
                result.success("${packageName.uppercase()}_INTENT_NOT_RESOLVED")
                return
            }

            grantUriPermission(packageName, contentUri, Intent.FLAG_GRANT_READ_URI_PERMISSION)
            startActivity(intent)
            result.success("SUCCESS")
        } catch (e: Exception) {
            Log.e(TAG, "Exception while launching Snapchat share", e)
            result.error("LAUNCH_FAILED", e.message, e.stackTraceToString())
        }
    }

    private fun shareToSocialStory(imagePath: String, attributionUrl: String?, packageName: String, action: String, urlKey: String, result: MethodChannel.Result) {
        try {
            Log.d(TAG, "shareToSocialStory called for $packageName")
            val imageFile = File(imagePath)
            if (!imageFile.exists()) {
                result.error("FILE_NOT_FOUND", "PNG file does not exist at path: $imagePath", null)
                return
            }

            val authority = "${applicationContext.packageName}.fileprovider"
            val contentUri: Uri = FileProvider.getUriForFile(applicationContext, authority, imageFile)

            val intent = Intent(action).apply {
                setDataAndType(contentUri, "image/png")
                flags = Intent.FLAG_GRANT_READ_URI_PERMISSION
                setPackage(packageName)
                if (!attributionUrl.isNullOrBlank()) {
                    putExtra(urlKey, attributionUrl)
                }
            }

            val canHandle = intent.resolveActivity(packageManager) != null
            if (!canHandle) {
                result.success("${packageName.uppercase()}_INTENT_NOT_RESOLVED")
                return
            }

            grantUriPermission(
                packageName,
                contentUri,
                Intent.FLAG_GRANT_READ_URI_PERMISSION
            )

            startActivity(intent)
            result.success("SUCCESS")
        } catch (e: Exception) {
            Log.e(TAG, "Exception while launching social story share", e)
            result.error("LAUNCH_FAILED", e.message, e.stackTraceToString())
        }
    }
}
