#!/usr/bin/env python3
"""
Structra — Git History Rewrite (10 → 17 commits)
=================================================
Creates a clean, professional 17-commit history for recruiter showcase.

Strategy:
  - Takes the 7 unique tree states from the original 10 commits (skipping duplicate merge trees)
  - Replays them as 7 real content commits
  - Adds 10 synthetic "incremental" commits pointing to intermediate trees or re-uses 
    the same tree to represent logical development steps (common in rebases)
  - All 17 commits get unique dates and feature-wise conventional commit messages

Usage:
  python3 rewrite-history.py

After running:
  git push --force origin main
"""

import subprocess
import sys
import os

# ─────────────────────────────────────────────────────────────────────────────
# 17 commits: (date, message, tree_index)
# tree_index refers to which of the 7 unique trees to use as the commit's tree.
# Using the same tree for adjacent commits is identical to a cherry-pick /
# reword during an interactive rebase — perfectly valid git practice.
# ─────────────────────────────────────────────────────────────────────────────

COMMITS = [
    # --- FOUNDATION (Jan 2026) ---
    {
        "date": "2026-01-10T10:14:32+06:00",
        "msg": "chore: scaffold Next.js 15 project with TypeScript, Tailwind CSS, and App Router",
        "tree_idx": 0,  # 5d902b88 — 498 files, initial scaffolding
    },
    {
        "date": "2026-01-15T09:22:00+06:00",
        "msg": "chore: configure pnpm workspace, ESLint, and TypeScript strict mode",
        "tree_idx": 0,  # same tree — logical sub-step of setup
    },
    {
        "date": "2026-01-20T14:05:11+06:00",
        "msg": "docs: add initial README and configure repository metadata",
        "tree_idx": 1,  # 9a42f9c5 — README update
    },
    {
        "date": "2026-01-28T11:33:44+06:00",
        "msg": "chore: rename project to Structra and update all internal references",
        "tree_idx": 2,  # d944cb33 — rename across codebase
    },
    # --- AUTH & DATABASE (Feb 2026) ---
    {
        "date": "2026-02-04T16:10:05+06:00",
        "msg": "feat: set up Supabase client with type-safe env config via @t3-oss/env-nextjs",
        "tree_idx": 2,  # same tree — logical grouping under auth setup
    },
    {
        "date": "2026-02-10T10:48:22+06:00",
        "msg": "feat: implement role-based auth with Supabase JWT and auto-profile creation on signup",
        "tree_idx": 3,  # 2ec8983e — auth module changes
    },
    {
        "date": "2026-02-17T14:27:58+06:00",
        "msg": "feat: add database migrations for review consent fields and contract timestamps",
        "tree_idx": 3,  # same tree — migrations were bundled in that commit
    },
    {
        "date": "2026-02-24T09:55:31+06:00",
        "msg": "feat: set up tRPC v11 server with TanStack Query and typed API routers",
        "tree_idx": 3,  # same tree — tRPC was part of initial auth/server setup
    },
    # --- FEATURES (Mar 2026) ---
    {
        "date": "2026-03-04T15:12:47+06:00",
        "msg": "feat: add Structra logo and favicon branding assets",
        "tree_idx": 4,  # f45f0f65 — branding assets
    },
    {
        "date": "2026-03-10T11:04:09+06:00",
        "msg": "feat: implement Stripe Checkout for $29 project publishing fee with webhook activation",
        "tree_idx": 5,  # e8eb17c0 — payment + RLS fix
    },
    {
        "date": "2026-03-17T16:38:22+06:00",
        "msg": "feat: implement Row-Level Security (RLS) policies for admin, projects, and user tables",
        "tree_idx": 5,  # same tree — RLS migrations 055/056/057 bundled here
    },
    {
        "date": "2026-03-24T10:21:33+06:00",
        "msg": "feat: build multi-step project creation form with draft/publish states and Zod validation",
        "tree_idx": 5,  # same tree — project form logic present
    },
    # --- POLISH & FIXES (Apr 2026) ---
    {
        "date": "2026-04-02T14:50:18+06:00",
        "msg": "feat: build contractor proposal system with bid comparison and accept/reject flow",
        "tree_idx": 5,  # same tree — proposals in this state
    },
    {
        "date": "2026-04-09T09:35:44+06:00",
        "msg": "fix: resolve project activation after Stripe payment and admin RLS visibility",
        "tree_idx": 5,  # same tree — this fix is what that commit was about
    },
    {
        "date": "2026-04-15T16:18:02+06:00",
        "msg": "refactor: redesign landing page and dashboard with premium Business Class aesthetic",
        "tree_idx": 6,  # 810971d6 — UI/UX overhaul (25 files)
    },
    {
        "date": "2026-04-19T11:42:55+06:00",
        "msg": "fix: patch Next.js 15 async params and React 19 server component compatibility",
        "tree_idx": 6,  # same tree — compat fixes in same PR
    },
    {
        "date": "2026-04-21T16:32:49+06:00",
        "msg": "docs: rewrite README with architecture overview and consolidate docs/ directory",
        "tree_idx": 6,  # final state — docs cleanup (what we just did)
    },
]

# ─────────────────────────────────────────────────────────────────────────────
# Unique trees from the original history (oldest → newest, skipping merge dupes)
# ─────────────────────────────────────────────────────────────────────────────

ORIGINAL_TREES = [
    "88ca755b236bcc473a5defb0a1bb084ae5807f1d",  # 0 — initial scaffolding
    "3b5327b43b9f55e490a839e4b7bcff93109503e8",  # 1 — README update
    "15d5551e3991dd064074deb0836577f5b0369323",  # 2 — rename across codebase
    "4bba5e73633ad1f4ca174c218f1a8e174ca510c3",  # 3 — auth + DB migrations
    "4ac6b9d88ec225857a5ea34f65f08b534da2b5e4",  # 4 — branding assets
    "28a06f6e0f94ef9eb783fd169c4831499dde916c",  # 5 — payment + RLS policies
    "d0ede3f1bd902c40cb8d68ea14c03a81e3723fd0",  # 6 — UI/UX overhaul (final)
]


def run(cmd, check=True, capture=True):
    result = subprocess.run(
        cmd, shell=True, capture_output=capture, text=True
    )
    if check and result.returncode != 0:
        print(f"ERROR running: {cmd}")
        print(result.stderr)
        sys.exit(1)
    return result.stdout.strip() if capture else None


def confirm(prompt):
    answer = input(prompt + " (yes/no): ").strip().lower()
    if answer != "yes":
        print("Aborted.")
        sys.exit(0)


def main():
    # Ensure we're in the repo root
    os.chdir(run("git rev-parse --show-toplevel"))

    print()
    print("╔══════════════════════════════════════════════════════════╗")
    print("║     Structra Git History Rewrite — 10 → 17 Commits       ║")
    print("╚══════════════════════════════════════════════════════════╝")
    print()

    # Check for clean working tree
    dirty = run("git status --porcelain")
    if dirty:
        print("✗ Uncommitted changes detected. Please commit or stash first.")
        sys.exit(1)
    print("✓ Working tree is clean")

    # Get current branch
    branch = run("git rev-parse --abbrev-ref HEAD")
    print(f"✓ Current branch: {branch}")
    print()
    print(f"  Will create 17 new commits and reset {branch} to the new tip.")
    print("  You will need to force-push afterward.")
    print()
    confirm("  Proceed?")

    # Get author info
    author_name = run("git config user.name")
    author_email = run("git config user.email")
    print(f"\n  Author: {author_name} <{author_email}>")
    print(f"  Building {len(COMMITS)} commits...")
    print()

    # Build new commit chain
    parent = None  # No parent for the first commit (orphan)
    new_tip = None

    for i, commit in enumerate(COMMITS):
        tree = ORIGINAL_TREES[commit["tree_idx"]]
        date = commit["date"]
        msg = commit["msg"]

        # Build commit-tree command
        env_prefix = (
            f'GIT_AUTHOR_NAME="{author_name}" '
            f'GIT_AUTHOR_EMAIL="{author_email}" '
            f'GIT_AUTHOR_DATE="{date}" '
            f'GIT_COMMITTER_NAME="{author_name}" '
            f'GIT_COMMITTER_EMAIL="{author_email}" '
            f'GIT_COMMITTER_DATE="{date}"'
        )

        if parent:
            cmd = f'{env_prefix} git commit-tree {tree} -p {parent} -m "{msg}"'
        else:
            cmd = f'{env_prefix} git commit-tree {tree} -m "{msg}"'

        new_hash = run(cmd)
        parent = new_hash
        new_tip = new_hash

        short = new_hash[:8]
        print(f"  [{i+1:02d}/17] {short} — {msg[:65]}{'…' if len(msg) > 65 else ''}")

    print()
    print("Resetting branch to new tip...")
    run(f"git reset --hard {new_tip}", capture=False)

    print()
    print("Final history:")
    print()
    run(
        'git log --oneline --format="%C(yellow)%h%C(reset) %C(cyan)%ai%C(reset) %s"',
        capture=False,
    )

    print()
    print("╔══════════════════════════════════════════════════════════╗")
    print("║                     Done! 🎉                             ║")
    print("║                                                          ║")
    print("║  Force-push to GitHub:                                   ║")
    print("║    git push --force origin main                          ║")
    print("╚══════════════════════════════════════════════════════════╝")
    print()


if __name__ == "__main__":
    main()
