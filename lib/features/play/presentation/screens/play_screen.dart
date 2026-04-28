import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hamme_app/utils/constants/colors.dart';
import '../../../shared/presentation/widgets/hamme_bottom_nav_bar.dart';
import '../../../shared/presentation/widgets/hamme_top_bar.dart';
import '../widgets/play_empty_state.dart';

class PlayScreen extends StatelessWidget {
  const PlayScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: TColors.white,
      body: SafeArea(
        child: Column(
          children: [
            const HammeTopBar(),

            Expanded(
              child: Center(
                child: const PlayEmptyState(),
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: HammeBottomNavBar(
        currentIndex: 1,
        onTap: (index) {
          if (index == 0) {
            context.go('/home');
          } else if (index == 2) {
            context.go('/inbox');
          }
        },
      ),
    );
  }
}
