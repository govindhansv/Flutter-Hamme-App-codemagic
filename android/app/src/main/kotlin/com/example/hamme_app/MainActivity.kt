package com.example.hamme_app

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
                    shareToInstagramStory(path, link, result)
                }
                "isInstagramInstalled" -> {
                    val installed = isInstagramInstalled()
                    Log.d(TAG, "Instagram installed: $installed")
                    result.success(installed)
                }
                else -> result.notImplemented()
            }
        }
    }

    private fun isInstagramInstalled(): Boolean {
        return try {
            packageManager.getPackageInfo(INSTAGRAM_PACKAGE, 0)
            true
        } catch (_: Exception) {
            false
        }
    }

    private fun shareToInstagramStory(imagePath: String, attributionUrl: String?, result: MethodChannel.Result) {
        try {
            Log.d(TAG, "shareToInstagramStory called")
            Log.d(TAG, "Generated file path: $imagePath")
            val imageFile = File(imagePath)
            val exists = imageFile.exists()
            Log.d(TAG, "File exists: $exists")
            if (!exists) {
                result.error("FILE_NOT_FOUND", "PNG file does not exist at path: $imagePath", null)
                return
            }

            val authority = "${applicationContext.packageName}.fileprovider"
            val contentUri: Uri = FileProvider.getUriForFile(applicationContext, authority, imageFile)
            Log.d(TAG, "Generated content URI: $contentUri")
            Log.d(TAG, "Using FileProvider authority: $authority")

            val intent = Intent("com.instagram.share.ADD_TO_STORY").apply {
                setDataAndType(contentUri, "image/png")
                flags = Intent.FLAG_GRANT_READ_URI_PERMISSION
                setPackage(INSTAGRAM_PACKAGE)
                if (!attributionUrl.isNullOrBlank()) {
                    putExtra("content_url", attributionUrl)
                }
            }
            Log.d(TAG, "Intent created with action=com.instagram.share.ADD_TO_STORY type=image/png package=$INSTAGRAM_PACKAGE")

            val canHandle = intent.resolveActivity(packageManager) != null
            Log.d(TAG, "resolveActivity(packageManager) != null: $canHandle")
            if (!canHandle) {
                result.success("INSTAGRAM_INTENT_NOT_RESOLVED")
                return
            }

            grantUriPermission(
                INSTAGRAM_PACKAGE,
                contentUri,
                Intent.FLAG_GRANT_READ_URI_PERMISSION
            )
            Log.d(TAG, "Granted URI read permission to $INSTAGRAM_PACKAGE")

            startActivity(intent)
            Log.d(TAG, "Instagram Story activity launched")
            result.success("SUCCESS")
        } catch (e: Exception) {
            Log.e(TAG, "Exception while launching Instagram Story", e)
            result.error("LAUNCH_FAILED", e.message, e.stackTraceToString())
        }
    }
}
