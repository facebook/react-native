import java.util.Scanner;

class Application {
    private String name;
    private String description;
    private double version;

    public Application(String name, String description, double version) {
        this.name = name;
        this.description = description;
        this.version = version;
    }

    public void updateVersion(double newVersion) {
        this.version = newVersion;
        System.out.println("Version updated to " + newVersion);
    }

    public void updateDescription(String newDescription) {
        this.description = newDescription;
        System.out.println("Description updated: " + newDescription);
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public double getVersion() {
        return version;
    }
}

public class ApplicationManager {
    private static final int MAX_APPLICATIONS = 100;
    private static Application[] applications = new Application[MAX_APPLICATIONS];
    private static int appCount = 0;

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        while (true) {
            System.out.println("\nApplication Management System");
            System.out.println("1. Create Application");
            System.out.println("2. Update Application Version");
            System.out.println("3. Update Application Description");
            System.out.println("4. Delete Application");
            System.out.println("5. Exit");
            System.out.print("Enter your choice: ");
            int choice = scanner.nextInt();
            scanner.nextLine(); // Consume newline character

            switch (choice) {
                case 1:
                    if (appCount < MAX_APPLICATIONS) {
                        System.out.print("Enter application name: ");
                        String name = scanner.nextLine();
                        System.out.print("Enter application description: ");
                        String description = scanner.nextLine();
                        System.out.print("Enter application version: ");
                        double version = scanner.nextDouble();
                        scanner.nextLine(); // Consume newline character
                        Application newApp = new Application(name, description, version);
                        applications[appCount] = newApp;
                        appCount++;
                        System.out.println("Application created successfully.");
                    } else {
                        System.out.println("Maximum applications limit reached.");
                    }
                    break;
                case 2:
                    updateVersion();
                    break;
                case 3:
                    updateDescription();
                    break;
                case 4:
                    deleteApplication();
                    break;
                case 5:
                    System.out.println("Thank you for using Application Management System. Goodbye!");
                    System.exit(0);
                    break;
                default:
                    System.out.println("Invalid choice. Please try again.");
            }
        }
    }

    private static void updateVersion() {
        Scanner scanner = new Scanner(System.in);
        System.out.print("Enter application name to update version: ");
        String appName = scanner.nextLine();
        boolean found = false;
        for (int i = 0; i < appCount; i++) {
            if (applications[i].getName().equalsIgnoreCase(appName)) {
                System.out.print("Enter new version: ");
                double newVersion = scanner.nextDouble();
                applications[i].updateVersion(newVersion);
                found = true;
                break;
            }
        }
        if (!found) {
            System.out.println("Application not found.");
        }
    }

    private static void updateDescription() {
        Scanner scanner = new Scanner(System.in);
        System.out.print("Enter application name to update description: ");
        String appName = scanner.nextLine();
        boolean found = false;
        for (int i = 0; i < appCount; i++) {
            if (applications[i].getName().equalsIgnoreCase(appName)) {
                System.out.print("Enter new description: ");
                String newDescription = scanner.nextLine();
                applications[i].updateDescription(newDescription);
                found = true;
                break;
            }
        }
        if (!found) {
            System.out.println("Application not found.");
        }
    }

    private static void deleteApplication() {
        Scanner scanner = new Scanner(System.in);
        System.out.print("Enter application name to delete: ");
        String appName = scanner.nextLine();
        boolean found = false;
        for (int i = 0; i < appCount; i++) {
            if (applications[i].getName().equalsIgnoreCase(appName)) {
                // Delete the application by shifting elements
                for (int j = i; j < appCount - 1; j++) {
                    applications[j] = applications[j + 1];
                }
                appCount--;
                found = true;
                System.out.println("Application deleted successfully.");
                break;
            }
        }
        if (!found) {
            System.out.println("Application not found.");
        }
    }
}
