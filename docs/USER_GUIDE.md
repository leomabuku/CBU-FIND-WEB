# User guide

## Sign in

Choose Email, Phone, or Google. Phone numbers should use international format such as `+260970000000`. New users receive a Firestore profile automatically.

## Browse reports

- Use Lost and Found tabs to change report type.
- Search by item name, description, category, or location.
- Choose a category to narrow results.
- Enable **Show returned** to include closed reports.
- The sync card shows whether results came from Firebase or the browser cache.

## Publish a report

1. Select **Create report**.
2. Choose Lost or Found.
3. Add a specific title and category.
4. Describe identifying details without exposing sensitive information.
5. Enter the campus location and a safe contact method.
6. Optionally choose up to three images.
7. Select **Publish report** and wait for uploads to finish.

Reports appear on Android and web after Firestore confirms the write.

## Contact a reporter

Open a report and choose **Contact reporter**. The browser opens email for addresses and the phone handler for numbers. Do not send passwords, PINs, verification codes, bank details, or payment.

## Mark an item returned

Only the report owner sees **Mark as returned**. Confirming changes the shared status to `RESOLVED`. The report remains available under **Show returned** and in the owner's profile.

## Edit a profile

Open **My profile**, select **Edit profile**, update details, and save. A new image is optional. Email identity is managed by Firebase Authentication and is not changed from this screen.

## Sign out

Use **Sign out** at the bottom of the desktop menu. On mobile, open the menu button first.
