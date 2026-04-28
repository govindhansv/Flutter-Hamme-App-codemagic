import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:hamme_app/utils/constants/colors.dart';
import 'package:hamme_app/utils/constants/fonts.dart';
import 'package:hamme_app/utils/constants/text_strings.dart';

class HammeBottomNavBar extends StatelessWidget {
  const HammeBottomNavBar({
    required this.currentIndex,
    required this.onTap,
    super.key,
  });

  final int currentIndex;
  final ValueChanged<int> onTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: TColors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            offset: const Offset(0, -4),
            blurRadius: 10,
          ),
        ],
      ),
      child: BottomNavigationBar(
        backgroundColor: TColors.white,
        elevation: 0,
        type: BottomNavigationBarType.fixed,
        currentIndex: currentIndex,
        onTap: onTap,
        selectedItemColor: TColors.black,
        unselectedItemColor: TColors.black.withValues(alpha: 0.4),
        selectedLabelStyle: const TextStyle(
          fontFamily: TFonts.nunito,
          fontWeight: FontWeight.w900,
          fontSize: 12,
        ),
        unselectedLabelStyle: const TextStyle(
          fontFamily: TFonts.nunito,
          fontWeight: FontWeight.w900,
          fontSize: 12,
        ),
        items: [
          BottomNavigationBarItem(
            icon: Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Opacity(
                opacity: currentIndex == 0 ? 1 : 0.4,
                child: const Icon(CupertinoIcons.share, size: 24),
              ),
            ),
            label: TTexts.navShare,
          ),
          BottomNavigationBarItem(
            icon: Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Opacity(
                opacity: currentIndex == 1 ? 1 : 0.4,
                child: const Icon(CupertinoIcons.flame_fill, size: 24),
              ),
            ),
            label: TTexts.navPlay,
          ),
          BottomNavigationBarItem(
            icon: Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Opacity(
                opacity: currentIndex == 2 ? 1 : 0.4,
                child: const Icon(CupertinoIcons.tray_fill, size: 24),
              ),
            ),
            label: TTexts.navInbox,
          ),
        ],
      ),
    );
  }
}
