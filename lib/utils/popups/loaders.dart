import 'package:flutter/material.dart';

import '../constants/colors.dart';
import '../helpers/helper_functions.dart';

class TLoaders {
  static hideSnackBar(BuildContext context) => ScaffoldMessenger.of(context).hideCurrentSnackBar();

  static customToast({required BuildContext context, required String message}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        elevation: 0,
        duration: const Duration(seconds: 3),
        backgroundColor: Colors.transparent,
        content: Container(
          padding: const EdgeInsets.all(12.0),
          margin: const EdgeInsets.symmetric(horizontal: 30),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(30),
            color: THelperFunctions.isDarkMode(context) ? TColors.darkerGrey.withValues(alpha: 0.9) : TColors.grey.withValues(alpha: 0.9),
          ),
          child: Center(child: Text(message, style: Theme.of(context).textTheme.labelLarge)),
        ),
      ),
    );
  }

  static successSnackBar({required BuildContext context, required String title, String message = '', int duration = 3}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        duration: Duration(seconds: duration),
        backgroundColor: TColors.primary,
        content: Row(
          children: [
            const Icon(Icons.check_circle, color: TColors.white),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  if (message.isNotEmpty) Text(message, style: const TextStyle(color: Colors.white)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  static warningSnackBar({required BuildContext context, required String title, String message = ''}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        duration: const Duration(seconds: 3),
        backgroundColor: Colors.orange,
        content: Row(
          children: [
            const Icon(Icons.warning_amber_rounded, color: TColors.white),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  if (message.isNotEmpty) Text(message, style: const TextStyle(color: Colors.white)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  static errorSnackBar({required BuildContext context, required String title, String message = ''}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        duration: const Duration(seconds: 3),
        backgroundColor: Colors.red.shade600,
        content: Row(
          children: [
            const Icon(Icons.warning_amber_rounded, color: TColors.white),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  if (message.isNotEmpty) Text(message, style: const TextStyle(color: Colors.white)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
