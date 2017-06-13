import { AfterViewInit, Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { Notification, NotificationType, Notifications } from 'ngx-base';
import { Context, Contexts } from 'ngx-fabric8-wit';
import { AuthenticationService, UserService, User } from 'ngx-login-client';
import { RemainingCharsComponent, RemainingCharsConfig } from 'ngx-widgets';

import { CopyService } from '../services/copy.service';
import { ExtProfile, GettingStartedService } from '../../getting-started/services/getting-started.service';
import { GitHubService } from "../../create/codebases/services/github.service";
import { ProviderService } from '../../getting-started/services/provider.service';
import { TenentService } from '../services/tenent.service';

@Component({
  selector: 'alm-update',
  templateUrl: 'update.component.html',
  styleUrls: ['./update.component.less'],
  providers: [CopyService, GettingStartedService, GitHubService, ProviderService, TenentService]
})
export class UpdateComponent implements AfterViewInit, OnInit {
  @ViewChild('_email') emailElement: ElementRef;
  @ViewChild('_bio') bioElement: RemainingCharsComponent;
  @ViewChild('_imageUrl') imageUrlElement: ElementRef;
  @ViewChild('remainingCountElement') remainingCountElement: ElementRef;
  @ViewChild('_url') urlElement: ElementRef;

  authGitHub: boolean = false;
  authOpenShift: boolean = false;
  bio: string;
  company: string;
  companyInvalid: boolean = false;
  context: Context;
  email: string;
  emailInvalid: boolean = false;
  gitHubLinked: boolean = false;
  imageUrl: string;
  imageUrlInvalid: boolean = false;
  loggedInUser: User;
  fullName: string;
  fullNameInvalid: boolean = false;
  openShiftLinked: boolean = false;
  registrationCompleted: boolean = true;
  remainingCharsConfig: RemainingCharsConfig;
  showActivity: boolean = true;
  showFullName: boolean = true;
  showEmail: boolean = true;
  showSpaces: boolean = true;
  showWorkItems: boolean = true;
  subscriptions: Subscription[] = [];
  token: string;
  tokenPanelOpen: boolean = false;
  username: string;
  usernameInvalid: boolean = false;
  url: string;
  urlInvalid: boolean = false;

  constructor(
      private auth: AuthenticationService,
      private copyService: CopyService,
      private gettingStartedService: GettingStartedService,
      private contexts: Contexts,
      private gitHubService: GitHubService,
      private notifications: Notifications,
      private providerService: ProviderService,
      private renderer: Renderer2,
      private router: Router,
      private tenentService: TenentService,
      private userService: UserService) {
    this.subscriptions.push(contexts.current.subscribe(val => this.context = val));
    this.subscriptions.push(userService.loggedInUser.subscribe(user => {
      this.loggedInUser = user;
      this.setUserProperties(user);
    }));
    this.subscriptions.push(auth.gitHubToken.subscribe(token => {
      this.gitHubLinked = (token !== undefined && token.length !== 0);
    }));
    this.subscriptions.push(auth.openShiftToken.subscribe(token => {
      this.openShiftLinked = (token !== undefined && token.length !== 0);
    }));
  }

  ngAfterViewInit(): void {
    // Set focus
    if (this.getRequestParam('bio') !== null) {
      this.setElementFocus(null, this.bioElement);
    } else if (this.getRequestParam('email') !== null) {
      this.setElementFocus(null, this.emailElement.nativeElement);
    } else if (this.getRequestParam('imageUrl') !== null) {
        this.setElementFocus(null, this.imageUrlElement.nativeElement);
    } else if (this.getRequestParam('url') !== null) {
      this.setElementFocus(null, this.urlElement.nativeElement);
    }
  }

  ngOnInit() {
    this.token = this.auth.getToken();
    this.remainingCharsConfig = {
      blockInputAtMaxLimit: true,
      charsMaxLimit: 255,
      charsRemainingElement: this.remainingCountElement,
      charsRemainingWarning: 5,
      id: "bio",
      inputType: "textarea",
      name: "bio",
      placeholder: "Enter your bio",
      rows: 5,
      value: this.bio
    } as RemainingCharsConfig;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
  }

  /**
   * Helper to test if connect accounts button should be disabled
   *
   * @returns {boolean}
   */
  get isConnectAccountsDisabled(): boolean {
    return !(this.authGitHub && !this.gitHubLinked || this.authOpenShift && !this.openShiftLinked)
      || (this.gitHubLinked && this.openShiftLinked);
  }

  get isUpdateProfileDisabled(): boolean {
    return (this.emailInvalid || this.imageUrlInvalid || this.urlInvalid);
  }

  // Actions

  /**
   * Link GitHub and/or OpenShift accounts
   */
  connectAccounts(): void {
    // Todo: Still cannot refresh current page, so send user to getting started page
    if (this.authGitHub && !this.gitHubLinked && this.authOpenShift && !this.openShiftLinked) {
      this.providerService.linkAll(window.location.origin + "/_gettingstarted?wait=true");
    } else if (this.authGitHub && !this.gitHubLinked) {
      this.providerService.linkGitHub(window.location.origin + "/_gettingstarted?wait=true");
    } else if (this.authOpenShift && !this.openShiftLinked) {
      this.providerService.linkOpenShift(window.location.origin + "/_gettingstarted?wait=true");
    }
  }

  /**
   * Copy token to the user's system clipboard
   */
  copyTokenToClipboard(): void {
    let result = this.copyService.copy(this.token);
    if (result) {
      this.notifications.message({
        message: `Token copied!`,
        type: NotificationType.SUCCESS
      } as Notification);
    } else {
      this.handleError("Failed to copy token", NotificationType.DANGER);
    }
  }

  /**
   * Handle bio change
   *
   * @param $event The new bio
   */
  handleBioChange($event: string): void {
    this.bio = $event;
  }

  linkImageUrl(): void {
    this.subscriptions.push(this.gitHubService.getUser().subscribe(user => {
      if (user.avatar_url !== undefined && user.avatar_url.length > 0) {
        this.imageUrl = user.avatar_url;
      } else {
        this.handleError("No image found", NotificationType.INFO);
      }
    }, error => {
      this.handleError("Unable to link image", NotificationType.WARNING);
    }));
  }

  /**
   * Route to user profile
   */
  routeToProfile(): void {
    this.router.navigate(['/', this.context.user.attributes.username]);
  }

  /**
   * Set element focus to given HTML elment
   *
   * @param $event The triggered event
   * @param element The component or HTML element to set focus
   */
  setElementFocus($event: MouseEvent, element: any) {
    if (element instanceof HTMLElement) {
      (element as HTMLElement).focus();
    } else if (element instanceof RemainingCharsComponent) {
      (element as RemainingCharsComponent).focus();
    }
  }

  /**
   * Toggle token panel open and close
   */
  toggleTokenPanel(): void {
    this.tokenPanelOpen = !this.tokenPanelOpen;
  }

  /**
   * Update user profile
   */
  updateProfile(): void {
    let profile = this.getTransientProfile();
    this.subscriptions.push(this.gettingStartedService.update(profile).subscribe(user => {
      this.setUserProperties(user);
      this.notifications.message({
        message: `Profile updated!`,
        type: NotificationType.SUCCESS
      } as Notification);
      this.routeToProfile();
    }, error => {
      if (error.status === 409) {
        this.handleError("Email already exists", NotificationType.DANGER);
      } else {
        this.handleError("Failed to update profile", NotificationType.DANGER);
      }
    }));
  }

  /**
   * Update tenent
   */
  updateTenent(): void {
    this.subscriptions.push(this.tenentService.updateTenent()
      .subscribe(res => {
        // Do nothing
        let test = "";
      }, error => {
        this.handleError("Failed to update tenent", NotificationType.DANGER);
      }));
  }

  /**
   * Validate email
   */
  validateEmail(): void {
    this.emailInvalid = !this.isEmailValid();
  }

  /**
   * Validate image URL
   */
  validateImageUrl(): void {
    this.imageUrlInvalid = !this.isImageUrlValid();
  }

  /**
   * Validate URL
   */
  validateUrl(): void {
    this.urlInvalid = !this.isUrlValid();
  }

  // Private

  /**
   * Helper to retrieve request parameters
   *
   * @param name The request parameter to retrieve
   * @returns {any} The request parameter value or null
   */
  private getRequestParam(name: string): string {
    let param = (new RegExp('[?&]' + encodeURIComponent(name) + '=([^&]*)')).exec(window.location.search);
    if (param != null) {
      return decodeURIComponent(param[1]);
    }
    return null;
  }

  /**
   * Get transient profile with updated properties
   *
   * @returns {ExtProfile} The updated transient profile
   */
  private getTransientProfile(): ExtProfile {
    let profile = this.gettingStartedService.createTransientProfile();
    delete profile.username;

    if (this.bio !== undefined && this.bio.length > 0) {
      profile.bio = this.bio.trim();
    }
    if (this.company !== undefined && this.company.length > 0) {
      profile.company = this.company.trim();
    }
    if (this.email !== undefined && this.email.trim().length > 0) {
      profile.email = this.email.trim();
    }
    if (this.fullName !== undefined && this.fullName.length > 0) {
      profile.fullName = this.fullName.trim();
    }
    if (this.imageUrl !== undefined && this.imageUrl.length > 0) {
      profile.imageURL = this.imageUrl.trim();
    }
    if (this.url !== undefined && this.url.length > 0) {
      profile.url = this.url.trim();
    }
    return profile;
  }

  /**
   * Helper to test if email is valid
   *
   * @returns {boolean}
   */
  private isEmailValid(): boolean {
    if (this.email !== undefined && this.email.trim().length > 0)
      return (this.email.trim().indexOf("@") !== -1);
    else {
      return (this.email.trim().length > 0);
    }
  }

  /**
   * Helper to test if image URL is valid
   *
   * @returns {boolean}
   */
  private isImageUrlValid(): boolean {
    if (this.imageUrl !== undefined && this.imageUrl.trim().length > 0)
      return (this.imageUrl.trim().indexOf("http") === 0);
    else {
      return true;
    }
  }

  /**
   * Helper to test if URL is valid
   *
   * @returns {boolean}
   */
  private isUrlValid(): boolean {
    if (this.url !== undefined && this.url.trim().length > 0)
      return (this.url.trim().indexOf("http") === 0);
    else {
      return true;
    }
  }

  /**
   * Set user properties
   *
   * @param user
   */
  private setUserProperties(user: User): void {
    this.bio = user.attributes.bio;
    this.company = user.attributes.company;
    this.email = user.attributes.email;
    this.fullName = user.attributes.fullName;
    this.imageUrl = user.attributes.imageURL;
    this.url = user.attributes.url;
    this.username = user.attributes.username;
  }

  private handleError(error: string, type: NotificationType) {
    this.notifications.message({
      message: error,
      type: type
    } as Notification);
  }
}
