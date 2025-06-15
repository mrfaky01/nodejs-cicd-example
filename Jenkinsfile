// Jenkinsfile
// This file defines your CI/CD pipeline using Jenkins Pipeline (Declarative Pipeline syntax).

// *** CRITICAL FIX: The entire pipeline must be wrapped in a 'pipeline { ... }' block. ***
pipeline {
    // Define the agent where the pipeline will run.
    // 'any' means Jenkins will use any available agent, including the built-in master if no agents are configured.
    // For production, you should use 'agent { label 'your-agent-label' }' to use dedicated build agents.
    agent any

    // Define environment variables that will be used throughout the pipeline.
    environment {
        // ECR_REPO_URI: The URI of your AWS ECR repository.
        // Replace "893437914041.dkr.ecr.eu-north-1.amazonaws.com/nodejs-cicd-example" with your actual ECR URI.
        ECR_REPO_URI = "893437914041.dkr.ecr.eu-north-1.amazonaws.com/nodejs-cicd-example"
        // AWS_REGION: Your AWS region.
        AWS_REGION = "eu-north-1"
        // IMAGE_TAG: The tag for your Docker image. We'll use the build number for uniqueness.
        IMAGE_TAG = "build-${BUILD_NUMBER}"
    }

    // Define the stages of your pipeline.
    stages {
        // Stage 1: Checkout - Get the source code from GitHub.
        stage('Checkout') {
            steps {
                // Cleans up the workspace before starting, good practice for fresh builds.
                cleanWs()
                // Checks out the code from the SCM (Source Code Management, i.e., your GitHub repo).
                // Jenkins automatically handles cloning the repo defined in the job configuration.
                checkout scm
            }
        }

        // Stage 2: Build Docker Image - Create the Docker image from your Dockerfile.
        stage('Build Docker Image') {
            steps {
                script {
                    // Build the Docker image.
                    // -t: Tag the image with the repository URI and a unique tag.
                    // .: Build context is the current directory (where Dockerfile is).
                    sh "docker build -t ${ECR_REPO_URI}:${IMAGE_TAG} ."
                    sh "echo 'Docker image built: ${ECR_REPO_URI}:${IMAGE_TAG}'"
                }
            }
        }

        // Stage 3: Authenticate with ECR - Get Docker login credentials for ECR.
        stage('Authenticate with ECR') {
            steps {
                script {
                    // Get ECR login command.
                    // The IAM role attached to the Jenkins EC2 instance grants permission for this.
                    def loginCommand = sh(script: "aws ecr get-login-password --region ${AWS_REGION}", returnStdout: true).trim()
                    // Use the login command to authenticate Docker.
                    // 'docker login' requires the password via stdin for security.
                    sh "echo ${loginCommand} | docker login --username AWS --password-stdin ${ECR_REPO_URI.split('/')[0]}"
                    sh "echo 'Authenticated with ECR.'"
                }
            }
        }

        // Stage 4: Push Docker Image to ECR - Upload the built image to your ECR repository.
        stage('Push Docker Image to ECR') {
            steps {
                script {
                    // Push the Docker image to ECR with its tag.
                    sh "docker push ${ECR_REPO_URI}:${IMAGE_TAG}"
                    sh "echo 'Docker image pushed to ECR: ${ECR_REPO_URI}:${IMAGE_TAG}'"
                }
            }
        }

        // Stage 5: Cleanup - Remove local Docker image to free up space.
        stage('Cleanup') {
            steps {
                script {
                    sh "docker rmi ${ECR_REPO_URI}:${IMAGE_TAG}"
                    sh "echo 'Local Docker image removed.'"
                }
            }
        }
    }

    // Define actions to take after the entire pipeline finishes.
    post {
        // Always run this block, regardless of success or failure.
        always {
            echo "Pipeline finished for ${ECR_REPO_URI}:${IMAGE_TAG}"
        }
        // Only run if the pipeline succeeded.
        success {
            echo "Pipeline completed successfully! Image pushed to ECR."
        }
        // Only run if the pipeline failed.
        failure {
            echo "Pipeline failed. Check logs for details."
        }
    }
} // End of pipeline block
