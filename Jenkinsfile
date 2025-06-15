// Jenkinsfile
// This file defines your CI/CD pipeline using Jenkins Pipeline (Declarative Pipeline syntax).

pipeline {
    agent any

    environment {
        // ECR_REPO_URI: The URI of your AWS ECR repository.
        // Replace with your actual ECR URI from terraform apply output.
        ECR_REPO_URI = "893437914041.dkr.ecr.eu-north-1.amazonaws.com/nodejs-cicd-example"
        // AWS_REGION: Your AWS region.
        AWS_REGION = "eu-north-1"
        // IMAGE_TAG: The tag for your Docker image. We'll use the build number for uniqueness.
        IMAGE_TAG = "build-${BUILD_NUMBER}"
        // DEPLOYMENT_SERVER_PRIVATE_IP: The private IP of your deployment EC2 instance.
        // Replace with your actual private IP from terraform apply output.
        DEPLOYMENT_SERVER_PRIVATE_IP = "10.0.11.63"
        // DEPLOYMENT_SSH_CREDENTIALS_ID: The ID of the SSH credential configured in Jenkins.
        DEPLOYMENT_SSH_CREDENTIALS_ID = "deployment-server-ssh-key"
    }

    stages {
        stage('Checkout') {
            steps {
                cleanWs()
                checkout scm
            }
        }

        // New Stage: Test
        stage('Test') {
            steps {
                script {
                    // Install Node.js 16 and npm on the Jenkins agent using NodeSource repository
                    // This is a more robust method if amazon-linux-extras topics are problematic.
                    sh """
                        echo "Installing Node.js 16 and npm on Jenkins agent using NodeSource..."
                        curl -fsSL https://rpm.nodesource.com/setup_16.x | sudo bash -
                        sudo yum install -y nodejs
                        echo "Node.js and npm installed on Jenkins agent."
                    """

                    sh "npm install" // Install app dependencies on the Jenkins agent for testing
                    sh "npm test"    // Run your unit tests (placeholder for now)
                    echo "Application tests passed!"
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    sh "docker build -t ${ECR_REPO_URI}:${IMAGE_TAG} ."
                    sh "echo 'Docker image built: ${ECR_REPO_URI}:${IMAGE_TAG}'"
                }
            }
        }

        stage('Authenticate with ECR') {
            steps {
                script {
                    def loginCommand = sh(script: "aws ecr get-login-password --region ${AWS_REGION}", returnStdout: true).trim()
                    sh "echo ${loginCommand} | docker login --username AWS --password-stdin ${ECR_REPO_URI.split('/')[0]}"
                    sh "echo 'Authenticated with ECR.'"
                }
            }
        }

        stage('Push Docker Image to ECR') {
            steps {
                script {
                    sh "docker push ${ECR_REPO_URI}:${IMAGE_TAG}"
                    sh "echo 'Docker image pushed to ECR: ${ECR_REPO_URI}:${IMAGE_TAG}'"
                }
            }
        }

        // New Stage: Deploy to EC2
        stage('Deploy to EC2') {
            steps {
                script {
                    // Use withCredentials to expose the SSH key securely
                    withCredentials([sshUserPrivateKey(credentialsId: "${DEPLOYMENT_SSH_CREDENTIALS_ID}", keyFileVariable: 'SSH_KEY_FILE')]) {
                        // Define the command to be executed on the remote server
                        def remoteCommands = """
                            #!/bin/bash
                            set -e # Exit immediately if a command exits with a non-zero status

                            # Get ECR login credentials on the deployment server
                            aws configure set default.region ${AWS_REGION}
                            login_output=\$(aws ecr get-login-password --region ${AWS_REGION})
                            echo \$login_output | docker login --username AWS --password-stdin ${ECR_REPO_URI.split('/')[0]}
                            echo "Successfully logged into ECR on deployment server."

                            # Stop and remove existing container if running
                            CONTAINER_NAME="nodejs-cicd-example-app"
                            if docker ps -q -f name=\$CONTAINER_NAME | grep -q .; then
                                echo "Stopping existing container \$CONTAINER_NAME..."
                                docker stop \$CONTAINER_NAME
                                docker rm \$CONTAINER_NAME
                                echo "Existing container stopped and removed."
                            else
                                echo "No existing container \$CONTAINER_NAME to stop/remove."
                            fi

                            # Pull the latest image
                            echo "Pulling image ${ECR_REPO_URI}:${IMAGE_TAG}..."
                            docker pull ${ECR_REPO_URI}:${IMAGE_TAG}
                            echo "Image pulled."

                            # Run the new container
                            echo "Starting new container \$CONTAINER_NAME from image ${ECR_REPO_URI}:${IMAGE_TAG}..."
                            docker run -d --name \$CONTAINER_NAME -p 80:3000 ${ECR_REPO_URI}:${IMAGE_TAG}
                            echo "Container \$CONTAINER_NAME started successfully on port 80."

                            # Clean up old images to save disk space
                            echo "Cleaning up old Docker images on deployment server..."
                            docker system prune -f
                            docker image prune -f
                            echo "Old Docker images pruned."
                        """

                        // Execute the commands on the remote deployment server via SSH
                        sshCommand(
                            remote: [
                                host: "${DEPLOYMENT_SERVER_PRIVATE_IP}",
                                username: "ec2-user",
                                credentialsId: "${DEPLOYMENT_SSH_CREDENTIALS_ID}",
                                name: "deployment-server" // <-- NEW: Add a logical name for the remote connection
                            ],
                            command: remoteCommands
                        )
                    }
                    echo "Application deployed to ${DEPLOYMENT_SERVER_PRIVATE_IP}!"
                }
            }
        }

        stage('Cleanup') {
            steps {
                script {
                    sh "docker rmi ${ECR_REPO_URI}:${IMAGE_TAG}"
                    sh "echo 'Local Docker image removed.'"
                }
            }
        }
    }

    post {
        always {
            echo "Pipeline finished for ${ECR_REPO_URI}:${IMAGE_TAG}"
        }
        success {
            echo "Pipeline completed successfully! Image pushed to ECR and deployed."
        }
        failure {
            echo "Pipeline failed. Check logs for details."
        }
    }
}
