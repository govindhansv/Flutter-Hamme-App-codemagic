import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:hamme_app/utils/constants/fonts.dart';

class ShareActionButton extends StatelessWidget {
  const ShareActionButton({
    super.key,
    required this.label,
    required this.showInstagram,
    required this.onTap,
  });

  final String label;
  final bool showInstagram;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        height: 56,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF9150FF), Color(0xFF8848F4)],
          ),
          borderRadius: BorderRadius.circular(28),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (showInstagram) ...[
              const Icon(CupertinoIcons.camera, color: Colors.white, size: 22),
              const SizedBox(width: 4),
            ],
            Text(
              label,
              style: const TextStyle(
                fontFamily: TFonts.nunito,
                fontWeight: FontWeight.w800,
                fontSize: 21,
                color: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
